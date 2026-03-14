// api/listings.js — PropTx VOW Datafeed
// Env var: AMPRE_TOKEN (set in Vercel)

const ODATA_BASE = 'https://query.ampre.ca/odata';
const BEARER_TOKEN = process.env.AMPRE_TOKEN;

export default async function handler(req, res) {
  const allowedOrigins = [
    'https://www.mississaugainvestor.ca',
    'https://mississaugainvestor.ca',
    'http://localhost:3000',
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!BEARER_TOKEN) {
    return res.status(500).json({ error: 'AMPRE_TOKEN not set in Vercel environment variables' });
  }

  try {
    const { page='1', limit='50', minPrice, maxPrice, beds, type, city, status='Active' } = req.query;
    const take = Math.min(parseInt(limit)||50, 100);
    const skip = (parseInt(page)-1)*take;
    const filters = [`StandardStatus eq '${status}'`];
    const CITIES = ['Mississauga','Port Credit','Streetsville','Clarkson','Lakeview','Erin Mills','Churchill Meadows','Cooksville','Hurontario','Meadowvale','Malton'];
    if (city) { filters.push(`City eq '${city}'`); }
    else { filters.push(`(${CITIES.map(c=>`City eq '${c}'`).join(' or ')})`); }
    if (minPrice) filters.push(`ListPrice ge ${parseInt(minPrice)}`);
    if (maxPrice) filters.push(`ListPrice le ${parseInt(maxPrice)}`);
    if (beds)     filters.push(`BedroomsTotal ge ${parseInt(beds)}`);
    if (type) {
      const m={detached:'Detached',semi:'Semi-Detached',townhouse:'Row/Townhouse',condo:'Condo Apartment',duplex:'Duplex'};
      filters.push(`PropertyType eq '${m[type.toLowerCase()]||type}'`);
    }

    const select = ['ListingKey','ListingId','ListPrice','OriginalListPrice','City','StateOrProvince','PostalCode','UnparsedAddress','StreetNumber','StreetName','StreetSuffix','UnitNumber','BedroomsTotal','BathroomsTotalInteger','PropertyType','PropertySubType','BuildingAreaTotal','LotSizeArea','LotSizeUnits','YearBuilt','DaysOnMarket','StandardStatus','MlsStatus','ListOfficeName','ListOfficePhone','PublicRemarks','Latitude','Longitude','ModificationTimestamp','Media'].join(',');

    const url = `${ODATA_BASE}/Property?$filter=${encodeURIComponent(filters.join(' and '))}&$select=${encodeURIComponent(select)}&$top=${take}&$skip=${skip}&$orderby=ModificationTimestamp desc&$count=true`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}`, Accept: 'application/json', 'User-Agent': 'MississaugaInvestor/1.0' },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `PropTx API returned ${response.status}`, detail: errText });
    }

    const data = await response.json();
    const listings = data.value || [];
    const totalCount = data['@odata.count'] || listings.length;

    return res.status(200).json({
      listings: listings.map(l=>enrichListing(l)),
      total: totalCount, page: parseInt(page), limit: take, pages: Math.ceil(totalCount/take),
      copyright: 'Listing information provided by PropTx Innovations Inc. Information deemed reliable but not guaranteed.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

function enrichListing(l) {
  const price=l.ListPrice||0, beds=l.BedroomsTotal||0, sqft=l.BuildingAreaTotal||0;
  const estimatedRent=estimateRent(price,beds,sqft,l.PropertyType);
  const metrics=calculateMetrics({price,estimatedRent});
  const dealScore=scoreDeal(metrics,l);
  const priceDrop=l.OriginalListPrice&&l.OriginalListPrice>price?Math.round(((l.OriginalListPrice-price)/l.OriginalListPrice)*100):0;
  return {
    id:l.ListingKey,mlsId:l.ListingId,price,
    address:formatAddress(l),city:l.City||'Mississauga',neighbourhood:l.City||'Mississauga',
    postalCode:l.PostalCode,beds,baths:l.BathroomsTotalInteger||0,halfBaths:0,
    sqft:sqft||null,lotSize:l.LotSizeArea,type:l.PropertyType||'',subType:l.PropertySubType||'',
    yearBuilt:l.YearBuilt||null,dom:l.DaysOnMarket||0,daysOnMarket:l.DaysOnMarket||0,
    status:l.StandardStatus,listingBrokerage:l.ListOfficeName||'',brokerage:l.ListOfficeName||'',
    remarks:l.PublicRemarks||'',notes:l.PublicRemarks||'',
    photos:extractImages(l.Media),images:extractImages(l.Media),
    lat:l.Latitude,lng:l.Longitude,originalPrice:l.OriginalListPrice||price,
    priceReduction:priceDrop,priceDrop,estimatedRent,rent:estimatedRent,
    ...metrics,dealScore,dealGrade:getDealGrade(dealScore),dealLabel:getDealLabel(dealScore),isSample:false,
  };
}

function calculateMetrics({price,estimatedRent,dpPct=0.20,rate=0.0599,years=25,taxRate=0.0072,ins=175,maintPct=0.05,vacRate=0.03}) {
  if(!price||!estimatedRent) return nullMetrics();
  const dp=price*dpPct,loan=price-dp,closing=price*0.015,cashIn=dp+closing;
  const effAnn=Math.pow(1+rate/2,2)-1,mr=Math.pow(1+effAnn,1/12)-1,n=years*12;
  const mtg=loan*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1);
  const annualEquity=(mtg-loan*mr)*12;
  const gross=estimatedRent,vac=gross*vacRate,eff=gross-vac;
  const tax=(price*taxRate)/12,maint=gross*maintPct,opex=tax+ins+maint;
  const noi=eff-opex,cf=noi-mtg;
  const capRate=((noi*12)/price)*100,coc=((cf*12)/cashIn)*100,grm=price/(gross*12);
  const totalReturn=((cf*12+annualEquity)/cashIn)*100;
  return {
    dp:Math.round(dp),loan:Math.round(loan),cashIn:Math.round(cashIn),closing:Math.round(closing),
    mtg:Math.round(mtg),gross:Math.round(gross),vac:Math.round(vac),eff:Math.round(eff),
    tax:Math.round(tax),ins:Math.round(ins),maint:Math.round(maint),opex:Math.round(opex),
    noi:Math.round(noi),noiYear:Math.round(noi*12),cf:Math.round(cf),cfYear:Math.round(cf*12),
    capRate:parseFloat(capRate.toFixed(2)),coc:parseFloat(coc.toFixed(2)),cashOnCash:parseFloat(coc.toFixed(2)),
    grm:parseFloat(grm.toFixed(1)),annualEquity:Math.round(annualEquity),totalReturn:parseFloat(totalReturn.toFixed(2)),
    monthlyCashFlow:Math.round(cf),annualCashFlow:Math.round(cf*12),mortgagePayment:Math.round(mtg),totalCashInvested:Math.round(cashIn),
  };
}

function nullMetrics(){return{dp:0,loan:0,cashIn:0,closing:0,mtg:0,gross:0,vac:0,eff:0,tax:0,ins:0,maint:0,opex:0,noi:0,noiYear:0,cf:0,cfYear:0,capRate:0,coc:0,cashOnCash:0,grm:0,annualEquity:0,totalReturn:0,monthlyCashFlow:0,annualCashFlow:0,mortgagePayment:0,totalCashInvested:0};}

function estimateRent(price,beds,sqft,type){
  const r={0:1800,1:2100,2:2600,3:3100,4:3700,5:4300};
  const base=r[Math.min(beds||0,5)]||2400;
  let b=(base*0.5)+((price*0.0043)*0.5);
  if(type&&type.toLowerCase().includes('detach'))b+=250;
  if(type&&type.toLowerCase().includes('condo'))b-=150;
  return Math.round(b/50)*50;
}

function scoreDeal(m,listing){
  if(!m||!m.capRate)return 5.0;
  let v=5.0;
  if(m.capRate>=5.5)v+=2.5;else if(m.capRate>=4.5)v+=1.8;else if(m.capRate>=4.0)v+=1.2;else if(m.capRate>=3.5)v+=0.7;else if(m.capRate>=3.0)v+=0.2;else if(m.capRate<2.5)v-=0.5;
  if(m.cf>=500)v+=2.0;else if(m.cf>=200)v+=1.5;else if(m.cf>=0)v+=1.0;else if(m.cf>=-300)v+=0.5;else if(m.cf>=-600)v+=0.0;else if(m.cf>=-1000)v-=0.3;else if(m.cf>=-1500)v-=0.7;else if(m.cf>=-2000)v-=1.0;else v-=1.5;
  const notes=(listing.PublicRemarks||'').toLowerCase();
  if(notes.includes('basement suite')||notes.includes('separate entrance')||notes.includes('legal suite')||notes.includes('duplex')||notes.includes('in-law')||notes.includes('second unit'))v+=1.5;
  else if(notes.includes('rough-in')||notes.includes('side entrance')||notes.includes('walk-up')||notes.includes('walk-out'))v+=0.7;
  const hood=(listing.City||'').toLowerCase();
  if(hood.includes('port credit')||hood.includes('lakeview'))v+=0.5;
  if(hood.includes('clarkson')||hood.includes('cooksville'))v+=0.25;
  if(m.grm<=16)v+=0.5;else if(m.grm>=28)v-=0.3;
  return parseFloat(Math.min(9.9,Math.max(1.0,v)).toFixed(1));
}

function getDealGrade(s){if(s>=8.5)return'A+';if(s>=7.5)return'A';if(s>=6.5)return'B+';if(s>=5.5)return'B';if(s>=4.5)return'C+';if(s>=3.5)return'C';return'D';}
function getDealLabel(s){if(s>=8.5)return'Exceptional Deal';if(s>=7.5)return'Strong Buy';if(s>=6.5)return'Good Deal';if(s>=5.5)return'Above Average';if(s>=4.5)return'Average';if(s>=3.5)return'Below Average';return'Weak';}

function formatAddress(l){
  const p=[l.UnitNumber?l.UnitNumber+'-':'',l.StreetNumber||'',' ',l.StreetName||'',l.StreetSuffix?' '+l.StreetSuffix:''].join('').trim();
  return p||l.UnparsedAddress||'Address on Request';
}

function extractImages(media){
  if(!media||!Array.isArray(media))return[];
  return media.filter(m=>m&&(m.MediaURL||m.MediaUrl)).sort((a,b)=>(a.Order||0)-(b.Order||0)).slice(0,15).map(m=>m.MediaURL||m.MediaUrl).filter(Boolean);
}
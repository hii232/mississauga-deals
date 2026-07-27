// The shared (auth) layout sets a static "Sign In" title (for /login), which
// /signup inherited verbatim — every "Sign Up" page and CTA on the site sent
// visitors to a page whose browser tab and SERP title said "Sign In". This
// nested layout overrides just the title for this segment; /login keeps the
// parent's "Sign In".
export const metadata = {
  // A plain 'Sign Up' string here did NOT inherit the root layout's
  // "%s | MississaugaInvestor.ca" template through the intermediate (auth)
  // layout (verified: rendered as a bare "Sign Up" with no brand suffix,
  // unlike every other page). Writing the full title directly sidesteps
  // that instead of depending on template inheritance at this nesting depth.
  title: 'Sign Up | MississaugaInvestor.ca',
};

export default function SignupLayout({ children }) {
  return children;
}

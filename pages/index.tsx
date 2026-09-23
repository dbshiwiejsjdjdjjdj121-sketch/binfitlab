import SitePage from "../src/components/SitePage";
import { routes } from "../src/site";
export default function HomePage() {
  return <SitePage route={routes[0]} />;
}
export function getStaticProps() {
  return { props: {} };
}

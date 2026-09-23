import SitePage from "../src/components/SitePage";
import { routes, type Route } from "../src/site";
export default function Page({ route }: { route: Route }) {
  return <SitePage route={route} />;
}
export function getStaticPaths() {
  return {
    paths: routes
      .filter((r) => r.path !== "/")
      .map((r) => ({ params: { slug: r.path.split("/").filter(Boolean) } })),
    fallback: false,
  };
}
export function getStaticProps({ params }: { params: { slug: string[] } }) {
  const route = routes.find((r) => r.path === `/${params.slug.join("/")}/`);
  return route ? { props: { route } } : { notFound: true };
}

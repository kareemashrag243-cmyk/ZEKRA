import { supabasePublic } from "../../lib/supabase";
import PublicSite from "../../components/PublicSite";

export default function CustomerPage({ customer }) {
  return <PublicSite customer={customer} />;
}

export async function getServerSideProps({ params }) {
  const { data, error } = await supabasePublic
    .from("customers")
    .select(
      "id, boy_name, girl_name, story_year, relationship_start_date, beginning_title, beginning_description, memory_images, gallery_images, music_url, video_url, video_cover_url, letter_text, signature, final_text"
    )
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    return { notFound: true };
  }

  return { props: { customer: data } };
}

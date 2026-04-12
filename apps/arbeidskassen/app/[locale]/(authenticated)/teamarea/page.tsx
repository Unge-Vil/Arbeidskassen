import {
  Button,
  Card,
  CardContent,
} from "@arbeidskassen/ui";
import { getTranslations } from "next-intl/server";

type FeedView = "feed" | "saved" | "announcements";
type PostType = "update" | "announcement" | "milestone";
type FeedGroup = "all-hands" | "design-team" | "operations";

type FeedPost = {
  id: string;
  type: PostType;
  author: string;
  team: string;
  audience: string;
  title: string;
  body: string;
  time: string;
  likes: number;
  comments: number;
  saved: boolean;
  pinned: boolean;
  group: FeedGroup;
};

function normalizeView(rawView?: string): FeedView {
  if (rawView === "saved" || rawView === "announcements") {
    return rawView;
  }

  return "feed";
}

function normalizeGroup(rawGroup?: string): FeedGroup {
  if (rawGroup === "design-team" || rawGroup === "operations") {
    return rawGroup;
  }

  return "all-hands";
}

export default async function TeamAreaHome({
  searchParams,
}: {
  searchParams?: Promise<{
    view?: string | string[];
    group?: string | string[];
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawView = Array.isArray(resolvedSearchParams?.view)
    ? resolvedSearchParams?.view[0]
    : resolvedSearchParams?.view;
  const rawGroup = Array.isArray(resolvedSearchParams?.group)
    ? resolvedSearchParams?.group[0]
    : resolvedSearchParams?.group;

  const view = normalizeView(rawView);
  const group = normalizeGroup(rawGroup);
  const t = await getTranslations("teamareaHome");

  const posts: FeedPost[] = [
    {
      id: "launch",
      type: "milestone",
      author: "Sarah Jenkins",
      team: t("groupLabels.designTeam"),
      audience: t("audience.department"),
      title: t("posts.launchTitle"),
      body: t("posts.launchBody"),
      time: t("posts.launchTime"),
      likes: 24,
      comments: 5,
      saved: true,
      pinned: false,
      group: "design-team",
    },
    {
      id: "announcement",
      type: "announcement",
      author: "Jan Helge Naley",
      team: t("groupLabels.allHands"),
      audience: t("audience.orgWide"),
      title: t("posts.announcementTitle"),
      body: t("posts.announcementBody"),
      time: t("posts.announcementTime"),
      likes: 18,
      comments: 2,
      saved: false,
      pinned: true,
      group: "all-hands",
    },
    {
      id: "ops",
      type: "update",
      author: "Mia Hansen",
      team: t("groupLabels.operations"),
      audience: t("audience.shift"),
      title: t("posts.opsTitle"),
      body: t("posts.opsBody"),
      time: t("posts.opsTime"),
      likes: 11,
      comments: 4,
      saved: true,
      pinned: false,
      group: "operations",
    },
  ];

  const filteredPosts = posts.filter((post) => {
    if (group !== "all-hands" && post.group !== group) {
      return false;
    }

    if (view === "saved") {
      return post.saved;
    }

    if (view === "announcements") {
      return post.type === "announcement";
    }

    return true;
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="rounded-xl border border-[var(--ak-border-soft)] shadow-sm bg-[var(--ak-bg-card)]">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ak-bg-hover)] text-xs font-bold text-[var(--ak-text-muted)] ring-1 ring-[var(--ak-border-soft)]">
              A
            </div>
            <div className="flex-1 rounded-full border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-4 py-2.5 text-[14px] text-[var(--ak-text-muted)] hover:bg-[var(--ak-bg-hover)] transition-colors cursor-text">
              {t("composer.prompt")}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="button" size="sm" variant="ghost" className="text-[var(--ak-text-muted)] font-medium hover:text-[var(--ak-text-main)] border-none hover:bg-[var(--ak-bg-hover)]">
              <svg className="w-4 h-4 mr-2 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              {t("composer.photoVideo")}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="text-[var(--ak-text-muted)] font-medium hover:text-[var(--ak-text-main)] border-none hover:bg-[var(--ak-bg-hover)]">
              <svg className="w-4 h-4 mr-2 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
              {t("composer.milestone")}
            </Button>
            <Button type="button" size="sm" className="ml-auto rounded-lg bg-[var(--ak-accent)] hover:bg-[var(--ak-accent)]/90 text-[var(--ak-accent-foreground)] px-6 font-semibold">
              {t("composer.post")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card className="bg-[var(--ak-bg-panel)]/90">
            <CardContent className="p-6 text-sm text-[var(--ak-text-muted)]">
              {t("emptyState")}
            </CardContent>
          </Card>
        ) : null}

        {filteredPosts.map((post) => {
          const isMilestone = post.type === "milestone";
          const isAnnouncement = post.type === "announcement";

          return (
            <Card
              key={post.id}
              className="rounded-xl border border-[var(--ak-border-soft)] shadow-sm bg-[var(--ak-bg-card)] overflow-hidden mt-4"
            >
              {isMilestone && (
                <div className="bg-blue-500/10 border-b border-[var(--ak-border-soft)] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-blue-500 text-[11px] font-bold uppercase tracking-wider">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                    MILESTONE REACHED
                  </div>
                  <button className="text-[var(--ak-text-muted)] hover:text-[var(--ak-text-main)]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                  </button>
                </div>
              )}
              {isAnnouncement && (
                <div className="bg-amber-500/10 border-b border-[var(--ak-border-soft)] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-amber-500 text-[11px] font-bold uppercase tracking-wider">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    {t("postTypes.announcement")}
                  </div>
                  <button className="text-[var(--ak-text-muted)] hover:text-[var(--ak-text-main)]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                  </button>
                </div>
              )}

              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ak-bg-hover)] text-xs font-bold text-[var(--ak-text-muted)] ring-1 ring-[var(--ak-border-soft)]">
                      {post.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--ak-text-main)] text-[14px] leading-tight">{post.author}</p>
                      <p className="text-[12px] text-[var(--ak-text-muted)] font-medium mt-0.5">
                        {post.team} · {post.time}
                      </p>
                    </div>
                  </div>
                  
                  {!isMilestone && !isAnnouncement && (
                    <button className="text-[var(--ak-text-muted)] hover:text-[var(--ak-text-main)] mt-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 mb-6">
                  <h2 className="text-[18px] font-bold text-[var(--ak-text-main)] tracking-tight leading-snug">{post.title}</h2>
                  <p className="text-[15px] text-[var(--ak-text-muted)] leading-relaxed">{post.body}</p>
                </div>

                <div className="flex items-center gap-6 border-t border-[var(--ak-border-soft)] pt-4 text-[var(--ak-text-muted)]">
                  <button className="flex items-center gap-2 hover:text-[var(--ak-text-main)] text-[13px] font-medium transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-2 hover:text-[var(--ak-text-main)] text-[13px] font-medium transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    {post.comments} {t("meta.comments")}
                  </button>
                  <button className="ml-auto flex items-center gap-2 hover:text-[var(--ak-text-main)] text-[12px] font-semibold uppercase tracking-wide transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    {t("meta.share")}
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

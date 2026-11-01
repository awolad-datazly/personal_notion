import { NextResponse } from "next/server";

export type MemeData = {
  postLink: string;
  subreddit: string;
  title: string;
  url: string;
  nsfw: boolean;
  author: string;
  ups: number;
};

const FALLBACK_MEMES: MemeData[] = [
  {
    postLink: "https://reddit.com/r/ProgrammerHumor",
    subreddit: "ProgrammerHumor",
    title: "Git push --force and close laptop immediately",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
    nsfw: false,
    author: "senior_dev_at_4am",
    ups: 4210,
  },
  {
    postLink: "https://reddit.com/r/ProgrammerHumor",
    subreddit: "ProgrammerHumor",
    title: "Centering a div in CSS vs Building a distributed consensus engine",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    nsfw: false,
    author: "css_hater_42",
    ups: 8940,
  },
  {
    postLink: "https://reddit.com/r/ProgrammerHumor",
    subreddit: "ProgrammerHumor",
    title: "Junior: It compiles! Senior: Why did production alarms start blaring?",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    nsfw: false,
    author: "pagerduty_survivor",
    ups: 6512,
  },
  {
    postLink: "https://reddit.com/r/ProgrammerHumor",
    subreddit: "ProgrammerHumor",
    title: "There are 10 types of people: those who understand binary and those who don't",
    url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80",
    nsfw: false,
    author: "null_pointer_ex",
    ups: 3200,
  },
  {
    postLink: "https://reddit.com/r/ProgrammerHumor",
    subreddit: "ProgrammerHumor",
    title: "When you fix a bug in production and 14 new bugs appear",
    url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
    nsfw: false,
    author: "hydra_debugger",
    ups: 5310,
  },
];

export async function GET() {
  try {
    const res = await fetch("https://meme-api.com/gimme/ProgrammerHumor/12", {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 120 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch from meme-api: ${res.status}`);
    }

    const data = (await res.json()) as {
      count?: number;
      memes?: MemeData[];
      url?: string;
      title?: string;
      ups?: number;
      nsfw?: boolean;
    };

    let list: MemeData[] = [];
    if (Array.isArray(data.memes)) {
      list = data.memes;
    } else if (data.url && data.title) {
      list = [data as MemeData];
    }

    // Filter out NSFW and ensure image URL exists
    const safeMemes = list.filter(
      (m) =>
        !m.nsfw &&
        m.url &&
        (m.url.endsWith(".png") ||
          m.url.endsWith(".jpg") ||
          m.url.endsWith(".jpeg") ||
          m.url.endsWith(".gif") ||
          m.url.includes("i.redd.it")),
    );

    if (safeMemes.length === 0) {
      return NextResponse.json({ memes: FALLBACK_MEMES });
    }

    return NextResponse.json({ memes: safeMemes });
  } catch {
    // Return curated fallback memes gracefully
    return NextResponse.json({ memes: FALLBACK_MEMES });
  }
}

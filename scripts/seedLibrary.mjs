/**
 * Seed script for the libraryResources Firestore collection.
 *
 * Prerequisites:
 *   1. Download a service account key from Firebase Console:
 *      Project Settings → Service Accounts → Generate new private key
 *      Save it as scripts/serviceAccount.json  (DO NOT commit this file)
 *   2. Install firebase-admin if not already installed:
 *      npm install -D firebase-admin
 *   3. Run from the Container directory:
 *      node scripts/seedLibrary.mjs
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const serviceAccount = require(join(__dirname, "serviceAccount.json"));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

const resources = [
  {
    category: "Group Basics",
    type: "Blog / Guide",
    title: "How to Start a Men's Group – Comprehensive Guide",
    author: "Andrew Horn (Substack)",
    url: "https://andrewhorn.substack.com/p/how-to-start-a-mens-group-the-definitive",
    description: "Deep-dive on structure, agreements, emotional inquiry, and meeting cadence. One of the best practical guides available.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Blog / Guide",
    title: "How to Start and Run a Men's Group Successfully",
    author: "Jordan Gray Consulting",
    url: "https://www.jordangrayconsulting.com/mens-group/",
    description: "Covers the 5 pillars (Commitment, Fire, Confidentiality, Courage, Truth), formats, and meeting structures.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Blog / Guide",
    title: "How to Get Your Men's Group Up and Running",
    author: "Jayson Gaddis",
    url: "https://www.jaysongaddis.com/how-to-start-a-mens-group/",
    description: "Practical step-by-step guide emphasizing format, ritual, and facilitation from a long-time men's group leader.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Blog / Guide",
    title: "How to Start a Men's Group – Easy Guide",
    author: "Taylor Johnson",
    url: "https://www.taylorjohnson.life/how-to-start-a-mens-group/",
    description: "Includes embodied check-in format, leadership models, and personal experience from 10+ years in men's groups.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Blog / Guide",
    title: "Key Principles for a Healthy Men's Group",
    author: "Essentially Men",
    url: "https://www.essentiallymen.net/key-principles-for-mens-groups",
    description: "Strong overview of leadership rotation, conflict resolution, confidentiality, and commitment structures.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Blog / Guide",
    title: "Guidelines for a Circle",
    author: "Open Men's Group",
    url: "https://openmensgroup.com/guidelines-for-a-circle/",
    description: "Concrete circle agreements: one voice, no advice-giving, I-statements, sobriety, equality. Great template for group agreements.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Blog / Guide",
    title: "How to Start a Men's Group",
    author: "MensGroup.com",
    url: "https://mensgroup.com/start-mens-group/",
    description: "Covers facilitation skills, meeting structure, commitment, common pitfalls, and free vs. paid dynamics.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Blog / Guide",
    title: "How to Start or Join a Men's Group (Not a 'Men's Group Guy')",
    author: "Travis Streb",
    url: "https://travisstreb.com/article/start-join-mens-group-not-a-mens-group-guy/",
    description: "Entry-level guide with a simple session format: wins, work blocks, commitments. Good for skeptics.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Video",
    title: "Owen Marcus TED Talk – Why Men Need to Gather",
    author: "Owen Marcus (EVRYMAN)",
    url: "https://www.youtube.com/watch?v=0tQQGWry_7k",
    description: "Co-founder of EVRYMAN on why men's emotional connection matters and what men's groups actually do.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Video",
    title: "What is EVRYMAN?",
    author: "EVRYMAN",
    url: "https://www.youtube.com/watch?v=dWUzNz4Jw4Y",
    description: "Short overview of the EVRYMAN model and how their groups work. Good introductory video for new members.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Video",
    title: "What Men Say About EVRYMAN",
    author: "EVRYMAN",
    url: "https://www.youtube.com/watch?v=DN8udbgb22I",
    description: "Testimonials from men in the EVRYMAN community on how groups changed their lives.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Website",
    title: "EVRYMAN – Men's Brotherhood & Community",
    author: "EVRYMAN",
    url: "https://www.evryman.com/",
    description: "One of the leading men's community platforms. Good reference for group models, formats, and facilitation approaches.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Group Basics",
    type: "Website",
    title: "ManKind Project",
    author: "ManKind Project",
    url: "https://mankindproject.org/",
    description: "Long-running global men's organization. Offers facilitator training, retreats (New Warrior), and peer-run groups (iGroups).",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Books",
    type: "Book",
    title: "A Circle of Men: The Original Manual for Men's Support Groups",
    author: "Bill Kauth",
    url: "https://www.amazon.com/Circle-Men-Original-Manual-Groups/dp/0312063504",
    description: "The foundational handbook for starting and facilitating men's groups. Step-by-step processes for trust, self-disclosure, and ritual. Written by a ManKind Project founder.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Books",
    type: "Book",
    title: "From The Core: A New Masculine Paradigm for Leading with Love",
    author: "John Wineland",
    url: "https://www.amazon.com/Core-Masculine-Paradigm-Leading-Healing/dp/1683648668",
    description: "Practical and embodied guide to masculine leadership, presence, and purpose. Rooted in somatic practice.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Books",
    type: "Book",
    title: "The Way of the Superior Man",
    author: "David Deida",
    url: "https://www.amazon.com/Way-Superior-Man-Spiritual-Challenges/dp/1622038320",
    description: "Foundational text on masculine-feminine polarity, sexual spirituality, and purpose. Required reading in the men's work canon.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Books",
    type: "Book",
    title: "Iron John: A Book About Men",
    author: "Robert Bly",
    url: "https://www.amazon.com/Iron-John-Book-About-Men/dp/0306824264",
    description: "Seminal mythopoetic exploration of masculinity through the Iron John fairy tale. Sparked the modern men's movement.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Books",
    type: "Book",
    title: "King, Warrior, Magician, Lover: Rediscovering the Archetypes of the Mature Masculine",
    author: "Robert Moore & Douglas Gillette",
    url: "https://www.amazon.com/King-Warrior-Magician-Lover-Rediscovering/dp/0062506064",
    description: "Jungian framework of the four masculine archetypes. Widely used in men's work as a model for mature masculine development.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Books",
    type: "Book",
    title: "Fire in the Belly: On Being a Man",
    author: "Sam Keen",
    url: "https://www.amazon.com/Fire-Belly-Being-Sam-Keen/dp/0553372009",
    description: "Explores men's relationship to vocation, initiation, women, and spiritual identity. Companion to Iron John in the mythopoetic tradition.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Books",
    type: "Book",
    title: "No More Mr. Nice Guy",
    author: "Dr. Robert Glover",
    url: "https://www.amazon.com/No-More-Mr-Nice-Guy/dp/0762415339",
    description: "Addresses people-pleasing, hidden resentment, and reclaiming authentic masculine identity. Widely referenced in men's groups.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Books",
    type: "Book",
    title: "Men's Group Manual",
    author: "ManKind Project",
    url: "https://www.mensgroupmanual.com/",
    description: "Practical manual from one of the world's largest men's organizations. Covers group structure, facilitation, and processes.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Practices",
    type: "Video",
    title: "Box Breathing – 10 Minute Guided Practice",
    author: "Wake Me Up (YouTube)",
    url: "https://youtu.be/Jy617u3-Rls",
    description: "Simple 10-minute guided box breathing (4-4-4-4 count). Great opening or closing ritual for a group session.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Practices",
    type: "Video",
    title: "5-Minute Box Breathing Guided Meditation",
    author: "Insight Timer / Love Elevate",
    url: "https://insighttimer.com/loveelevate/guided-meditations/5-minute-box-breathing-guided-meditation",
    description: "Short, accessible guided box breathing practice. Good for a quick group opening to settle the nervous system.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Practices",
    type: "Article / Guide",
    title: "John Wineland – Grounding & Breathwork Practice (22 min)",
    author: "John Wineland",
    url: "https://johnwineland.com/responsibility-integrity-purpose-embodying-artful-masculine-leadership-2/",
    description: "From the Embodied Men's Leadership Program. Connects the masculine body to earth and cosmos through breath, posture, and presence.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Practices",
    type: "Website",
    title: "John Wineland – Breathwork Practice Playlist (32 practices)",
    author: "John Wineland",
    url: "https://johnwinelandstreaming.vhx.tv/breathwork",
    description: "32 breathwork practices from 4 to 60 minutes. Includes grounding, heart-opening, energy clearing, and partner practices.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Practices",
    type: "Article / Guide",
    title: "The Essential Masculine Practice",
    author: "John Wineland",
    url: "https://johnwineland.com/the-essential-masculine-practice/",
    description: "Core 3-step masculine practice: relax body → place awareness → wait for impulse. Simple foundational practice for presence.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Practices",
    type: "Article / Guide",
    title: "Box Breathing – How to Do It, Benefits, and Tips",
    author: "Medical News Today",
    url: "https://www.medicalnewstoday.com/articles/321805",
    description: "Evidence-based overview of box breathing with step-by-step instructions. Good reference for facilitators teaching the practice.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Polarity & Embodiment",
    type: "Website",
    title: "David Deida – Official Site",
    author: "David Deida",
    url: "https://deida.info/",
    description: "Hub for Deida's workshops, writings, and teachings on sexual polarity, masculine-feminine dynamics, and embodied spirituality.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Polarity & Embodiment",
    type: "Website",
    title: "John Wineland – Official Site",
    author: "John Wineland",
    url: "https://johnwineland.com/",
    description: "Leading men's work and embodiment teacher. Offers courses, practices, and the Embodied Men's Leadership Training program.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Polarity & Embodiment",
    type: "Article",
    title: "ManKind Project – Recommended Books on Men's Work",
    author: "ManKind Project",
    url: "https://mankindproject.org/",
    description: "Curated reading list from one of the oldest and most respected men's organizations globally.",
    imageUrl: null,
    addedBy: "seed",
  },
  {
    category: "Polarity & Embodiment",
    type: "Article",
    title: "Everything You've Ever Wanted to Know About Men's Groups",
    author: "Our Fabriq",
    url: "https://ourfabriq.com/article/mens-groups",
    description: "Interview with somatic psychotherapist Jeff Howard on facilitation models, emotional safety, and the MKP and AMP approaches.",
    imageUrl: null,
    addedBy: "seed",
  },
];

async function seed() {
  console.log(`Seeding ${resources.length} library resources…`);
  const col = db.collection("libraryResources");

  // Check existing to avoid duplicates
  const existing = await col.get();
  const existingUrls = new Set(existing.docs.map((d) => d.data().url));

  let added = 0;
  let skipped = 0;

  for (const resource of resources) {
    if (existingUrls.has(resource.url)) {
      console.log(`  skip (exists): ${resource.title}`);
      skipped++;
      continue;
    }
    await col.add({ ...resource, addedAt: Timestamp.now() });
    console.log(`  added: ${resource.title}`);
    added++;
  }

  console.log(`\nDone. Added: ${added}, Skipped: ${skipped}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

export interface BlogAuthor {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
}

export const AUTHORS: Record<string, BlogAuthor> = {
  "shannon-mcgill": {
    id: "shannon-mcgill",
    name: "Shannon McGill",
    role: "Founder & CEO",
    image: "/images/founder.jpg",
    bio: "Shannon is a full-stack technologist and entrepreneur who founded CEO Sidekick to give every small business owner access to AI-powered executive guidance. With deep expertise in data engineering, cloud architecture, and business operations, Shannon builds tools that help founders make smarter decisions faster.",
  },
  "technology-partner": {
    id: "technology-partner",
    name: "Technology Partner",
    role: "AI Technology Advisor",
    image: "/images/avatars/technology-partner.png",
    bio: "CEO Sidekick's AI Technology Partner is an AI advisor that provides expert tips and guidance on software architecture, cloud infrastructure, data engineering, and digital transformation strategy. It draws on established industry knowledge — not personal experience.",
  },
  "executive-coach": {
    id: "executive-coach",
    name: "Executive Coach",
    role: "AI Executive Coach",
    image: "/images/avatars/executive-coach.png",
    bio: "CEO Sidekick's AI Executive Coach is an AI advisor that helps founders develop leadership skills, build high-performing teams, and navigate the challenges of scaling a business. It offers frameworks and actionable advice based on established coaching methodologies — not personal experience.",
  },
  "marketing-partner": {
    id: "marketing-partner",
    name: "Marketing Partner",
    role: "AI Marketing Advisor",
    image: "/images/avatars/marketing-partner.png",
    bio: "CEO Sidekick's AI Marketing Partner is an AI advisor that delivers strategic marketing guidance covering brand positioning, content strategy, digital marketing, and customer acquisition. It provides proven tactics and best practices — not personal experience.",
  },
  "sales-partner": {
    id: "sales-partner",
    name: "Sales Partner",
    role: "AI Sales Advisor",
    image: "/images/avatars/sales-partner.png",
    bio: "CEO Sidekick's AI Sales Partner is an AI advisor that provides guidance on sales strategy, pipeline management, deal negotiation, and revenue growth for small businesses. It shares proven frameworks and techniques — not personal experience.",
  },
  "legal-advisor": {
    id: "legal-advisor",
    name: "Legal Advisor",
    role: "AI Legal Advisor",
    image: "/images/avatars/legal-advisor.png",
    bio: "CEO Sidekick's AI Legal Advisor is an AI advisor that helps founders navigate business law, contracts, compliance, intellectual property, and regulatory requirements. It provides general legal information and guidance — not personal experience or legal counsel.",
  },
  "hr-partner": {
    id: "hr-partner",
    name: "HR Partner",
    role: "AI HR Advisor",
    image: "/images/avatars/hr-partner.png",
    bio: "CEO Sidekick's AI HR Partner is an AI advisor that provides guidance on hiring, employee relations, compensation, benefits, and building a positive workplace culture. It offers best practices and actionable frameworks — not personal experience.",
  },
  "content-engine": {
    id: "content-engine",
    name: "Content Engine",
    role: "AI Content Strategist",
    image: "/images/avatars/content-engine.png",
    bio: "CEO Sidekick's AI Content Engine is an AI advisor that helps businesses develop and execute content strategies that drive engagement, build authority, and generate leads. It provides proven content frameworks and tactics — not personal experience.",
  },
};

export function getAuthor(id: string): BlogAuthor | undefined {
  return AUTHORS[id];
}

export function getAuthorByName(name: string): BlogAuthor | undefined {
  return Object.values(AUTHORS).find(
    (author) => author.name.toLowerCase() === name.toLowerCase()
  );
}

export function getAllAuthors(): BlogAuthor[] {
  return Object.values(AUTHORS);
}

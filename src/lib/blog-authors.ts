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
    bio: "CEO Sidekick's AI Technology Partner provides expert guidance on software architecture, cloud infrastructure, data engineering, and digital transformation strategy.",
  },
  "executive-coach": {
    id: "executive-coach",
    name: "Executive Coach",
    role: "AI Executive Coach",
    image: "/images/avatars/executive-coach.png",
    bio: "CEO Sidekick's AI Executive Coach helps founders develop leadership skills, build high-performing teams, and navigate the challenges of scaling a business.",
  },
  "marketing-partner": {
    id: "marketing-partner",
    name: "Marketing Partner",
    role: "AI Marketing Advisor",
    image: "/images/avatars/marketing-partner.png",
    bio: "CEO Sidekick's AI Marketing Partner delivers strategic marketing guidance covering brand positioning, content strategy, digital marketing, and customer acquisition.",
  },
  "sales-partner": {
    id: "sales-partner",
    name: "Sales Partner",
    role: "AI Sales Advisor",
    image: "/images/avatars/sales-partner.png",
    bio: "CEO Sidekick's AI Sales Partner provides guidance on sales strategy, pipeline management, deal negotiation, and revenue growth for small businesses.",
  },
  "legal-advisor": {
    id: "legal-advisor",
    name: "Legal Advisor",
    role: "AI Legal Advisor",
    image: "/images/avatars/legal-advisor.png",
    bio: "CEO Sidekick's AI Legal Advisor helps founders navigate business law, contracts, compliance, intellectual property, and regulatory requirements.",
  },
  "hr-partner": {
    id: "hr-partner",
    name: "HR Partner",
    role: "AI HR Advisor",
    image: "/images/avatars/hr-partner.png",
    bio: "CEO Sidekick's AI HR Partner provides guidance on hiring, employee relations, compensation, benefits, and building a positive workplace culture.",
  },
  "content-engine": {
    id: "content-engine",
    name: "Content Engine",
    role: "AI Content Strategist",
    image: "/images/avatars/content-engine.png",
    bio: "CEO Sidekick's AI Content Engine helps businesses develop and execute content strategies that drive engagement, build authority, and generate leads.",
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

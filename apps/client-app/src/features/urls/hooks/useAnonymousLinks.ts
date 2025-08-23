
import { useState, useEffect } from 'react';

export interface AnonymousLink {
  shortId: string;
  longUrl: string;
  fullShortUrl: string;
  createdAt: number;
}

const MAX_ANONYMOUS_LINKS = 5;
const ANONYMOUS_LINKS_STORAGE_KEY = 'anonymousUserLinks';

export const getAnonymousLinks = (): AnonymousLink[] => {
  if (typeof window === 'undefined') return [];
  try {
    const storedLinks = localStorage.getItem(ANONYMOUS_LINKS_STORAGE_KEY);
    return storedLinks ? JSON.parse(storedLinks) : [];
  } catch (e) {
    console.error("Failed to parse anonymous links from localStorage", e);
    localStorage.removeItem(ANONYMOUS_LINKS_STORAGE_KEY);
    return [];
  }
};

export const addAnonymousLink = (newLink: AnonymousLink): AnonymousLink[] => {
  const currentLinks = getAnonymousLinks();
  const updatedLinks = [newLink, ...currentLinks].slice(0, MAX_ANONYMOUS_LINKS);
  if (typeof window !== 'undefined') {
    localStorage.setItem(ANONYMOUS_LINKS_STORAGE_KEY, JSON.stringify(updatedLinks));
  }
  return updatedLinks;
};

export function useAnonymousLinks() {
  const [anonymousLinks, setAnonymousLinks] = useState<AnonymousLink[]>(getAnonymousLinks());

  const handleStorageChange = () => {
    setAnonymousLinks(getAnonymousLinks());
  };

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addLink = (newLink: AnonymousLink) => {
    const updatedLinks = addAnonymousLink(newLink);
    setAnonymousLinks(updatedLinks);
    return updatedLinks.length >= MAX_ANONYMOUS_LINKS;
  };

  return { anonymousLinks, addAnonymousLink: addLink, setAnonymousLinks, MAX_ANONYMOUS_LINKS };
}

import catalog from './data/catalog.json';
import jobDatabase from './data/jobs.json';
import content from './data/website.json';

export const services = catalog.services;
export const projects = catalog.projects;
export const jobs = jobDatabase;
export const website = content;
export type Job = (typeof jobs)[number];
export const applicationLink = (job: Job) => `mailto:${website.company.email}?subject=${encodeURIComponent('Application - ' + job.title)}`;

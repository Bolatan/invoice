import Organization from '@/models/Organization';
import dbConnect from './db';

export async function getOrganizationBySlug(slug: string) {
  await dbConnect();
  let organization = await Organization.findOne({ slug });

  if (!organization && slug === 'default') {
    organization = await Organization.create({
      name: 'Default Organization',
      slug: 'default',
    });
  }

  return organization;
}

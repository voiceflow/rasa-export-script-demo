import fs from 'fs/promises';
import JSZip from 'jszip';
import path, { join } from 'path';

import execa from 'execa';
import { RasaDomainYml, RasaNluYml, RasaProjectContainer, RasaStoriesYml } from './types';
import { dump } from 'js-yaml';

// TODO: Make this convert JSON to YAML
const serialize = (obj: any) => dump(obj, { lineWidth: -1, quotingType: '"' });

const JSZIP_OPTIONS = {};

export const zipIntents = async (project: RasaProjectContainer, outputPath: string): Promise<void> => {
  const zip = JSZip();

  const domain: RasaDomainYml = { version: '3.1', ...project.domain };
  const stories: RasaStoriesYml = { version: '3.1', stories: project.stories };
  const nlu: RasaNluYml = { version: '3.1', nlu: project.nlu };
  // The domain, but with empty fields removed
  const trimmedDomain = Object.fromEntries(
    Object.entries(domain).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      } else if (typeof value === 'object') {
        return Object.keys(value).length > 0;
      } else {
        return true;
      }
    })
  );

  zip.file('domain.yml', serialize(trimmedDomain), JSZIP_OPTIONS);
  zip.file('data/stories.yml', serialize(stories), JSZIP_OPTIONS);
  zip.file('data/nlu.yml', serialize(nlu), JSZIP_OPTIONS);

  const prefix = join(__dirname, '..', 'project_unzipped');
  await fs.rm(prefix, { recursive: true, force: true });
  await fs.mkdir(prefix, { recursive: true });

  for (const file of Object.values(zip.files)) {
    if (file.dir) {
      await fs.mkdir(join(prefix, file.name), { recursive: true });
    } else {
      await fs.mkdir(path.dirname(join(prefix, file.name)), { recursive: true });

      await fs.writeFile(join(prefix, file.name), await file.async('nodebuffer'));
    }
  }

  await fs.rm(outputPath, { recursive: true, force: true });
  await execa('zip', ['-r', outputPath, './project_unzipped/'], { cwd: path.join(__dirname, '..') });
};

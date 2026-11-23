import { JsonMap } from './cms.models';
import type { SchemaField } from './cms-schema';

export interface CmsBlock {
  id: string;
  type: string;
  hidden?: boolean;
  layout?: {
    width?: 'full' | 'half' | 'third' | string;
    padding?: string;
    background?: string;
    backgroundImage?: string;
  };
  props: JsonMap;
}

export interface BlockTypeDef {
  type: string;
  label: string;
  icon: string;
  category: string;
  description: string;
  schema: SchemaField[];
  defaults: JsonMap;
}

export interface PageTemplateDef {
  id: string;
  label: string;
  description: string;
}

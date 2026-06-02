interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * data.gov.uk MCP — UK national open-data portal (CKAN API).
 *
 * Auth: none (keyless). Docs: https://docs.ckan.org/en/latest/api/
 *
 * Notes for callers:
 * - This is UK government open data: central-government departments, executive
 *   agencies, devolved administrations, local councils, NHS bodies, ONS, and
 *   public-sector publishers. All metadata (dataset titles, descriptions,
 *   organization names) is in ENGLISH. Records come back as UTF-8 JSON.
 * - The CKAN backend is served from ckan.publishing.service.gov.uk (the
 *   public data.gov.uk/api/3 host returns the HTML site, not JSON). CKAN
 *   responses are {success, result}; this pack unwraps to `result`.
 * - This instance does NOT expose CKAN groups (group_list) or the datastore
 *   row API (datastore_search) — both return 403. Datasets here are file
 *   resources (CSV/XLSX/ZIP/etc.) with download URLs, not queryable tables.
 *   Use `dataset_details` to surface each resource's download URL + format.
 * - The publisher taxonomy is the *organization* (e.g. office-for-national-
 *   statistics, natural-england). Filter searches by publisher with
 *   fq="organization:<name>"; browse publishers via list_organizations.
 */


const BASE = 'https://ckan.publishing.service.gov.uk/api/3/action';
const UA = 'pipeworx-mcp-datagov-uk/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_datasets',
    description:
      'Search the data.gov.uk catalogue (CKAN package_search) across 57k+ UK government open datasets. Returns matching datasets with titles, descriptions, publishing organization, and resources. Content is English. Pass an empty query to browse everything by relevance/sort.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search terms, e.g. "air quality", "house prices", "covid". Pass "" to list all datasets.' },
        fq: { type: 'string', description: 'Solr filter query, e.g. "organization:office-for-national-statistics", "res_format:CSV", or "tags:gtfs".' },
        rows: { type: 'number', description: 'Max results, 1-1000 (default 25).' },
        start: { type: 'number', description: '0-based offset for paging.' },
        sort: { type: 'string', description: 'Sort spec, e.g. "metadata_modified desc" or "score desc".' },
      },
      required: ['query'],
    },
  },
  {
    name: 'dataset_details',
    description:
      'Full dataset record by id or slug (CKAN package_show), including its resources. Each resource exposes a downloadable file: read "url" (the download link), "format" (CSV/XLSX/ZIP/etc.), and "name". data.gov.uk resources are files, not queryable datastore tables.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Dataset id (UUID) or slug, e.g. "nhs-regions-geography-april-20161".' } },
      required: ['id'],
    },
  },
  {
    name: 'list_organizations',
    description:
      'List publishing organizations on data.gov.uk (CKAN organization_list) — UK government departments, agencies, councils, NHS bodies, ONS, etc. Use a returned org "name" as fq="organization:<name>" in search_datasets to filter to that publisher.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Max orgs, 1-1000 (default 100).' } },
    },
  },
  {
    name: 'organization_details',
    description:
      'Full details for one publishing organization (CKAN organization_show): display name, description, dataset count, and (optionally) a sample of its datasets. Use to learn what a given UK publisher releases.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Organization id or slug, e.g. "office-for-national-statistics" or "natural-england".' },
        include_datasets: { type: 'boolean', description: 'If true, include a sample of the org\'s datasets in "packages" (default false).' },
      },
      required: ['id'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_datasets': {
      const params = new URLSearchParams({
        q: reqStr(args, 'query', '"air quality" or "" for all'),
        rows: String(clamp(args.rows, 25, 1, 1000)),
        start: String(Math.max(0, (args.start as number) ?? 0)),
      });
      if (args.fq) params.set('fq', String(args.fq));
      if (args.sort) params.set('sort', String(args.sort));
      return ckanGet(`/package_search?${params}`);
    }
    case 'dataset_details':
      return ckanGet(`/package_show?id=${encodeURIComponent(reqStr(args, 'id', '"nhs-regions-geography-april-20161"'))}`);
    case 'list_organizations': {
      const params = new URLSearchParams({ all_fields: 'true', limit: String(clamp(args.limit, 100, 1, 1000)) });
      return ckanGet(`/organization_list?${params}`);
    }
    case 'organization_details': {
      const params = new URLSearchParams({ id: reqStr(args, 'id', '"office-for-national-statistics"') });
      if (args.include_datasets === true) params.set('include_datasets', 'true');
      return ckanGet(`/organization_show?${params}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function ckanGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`data.gov.uk: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  const json = (await res.json()) as { success?: boolean; error?: { message?: string }; result?: unknown };
  if (json.success === false) throw new Error(`data.gov.uk: ${json.error?.message ?? 'request failed'}`);
  return json.result ?? json;
}

function clamp(v: unknown, dflt: number, lo: number, hi: number): number {
  const n = typeof v === 'number' ? v : dflt;
  return Math.min(hi, Math.max(lo, n));
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string') {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;

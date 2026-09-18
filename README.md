# mcp-datagov-uk

data.gov.uk MCP — UK national open-data portal (CKAN API).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_datasets` | Search the data.gov.uk catalogue (CKAN package_search) across 57k+ UK government open datasets. Returns matching datasets with titles, descriptions, publishing organization, and resources. Content is English. Pass an empty query to browse everything by relevance/sort. |
| `dataset_details` | Full dataset record by id or slug (CKAN package_show), including its resources. Each resource exposes a downloadable file: read "url" (the download link), "format" (CSV/XLSX/ZIP/etc.), and "name". data.gov.uk resources are files, not queryable datastore tables. |
| `list_organizations` | List publishing organizations on data.gov.uk (CKAN organization_list) — UK government departments, agencies, councils, NHS bodies, ONS, etc. Use a returned org "name" as fq="organization:<name>" in search_datasets to filter to that publisher. |
| `organization_details` | Full details for one publishing organization (CKAN organization_show): display name, description, dataset count, and (optionally) a sample of its datasets. Use to learn what a given UK publisher releases. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "datagov-uk": {
      "url": "https://gateway.pipeworx.io/datagov-uk/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/datagov-uk/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Datagov Uk data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/datagov_uk_search_datasets \
  -H 'Content-Type: application/json' \
  -d '{"query":"air quality"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/datagov_uk_search_datasets`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

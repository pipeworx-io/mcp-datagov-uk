# mcp-datagov-uk

data.gov.uk MCP — UK national open-data portal (CKAN API).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Datagov Uk data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

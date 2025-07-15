import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get wallet address from environment
const WALLET_ADDRESS =
  process.env.WALLET_1_ADDRESS || "YOUR_WALLET_ADDRESS_HERE";

const IRYS_GRAPHQL_ENDPOINT = "https://gateway.irys.xyz/";

const query = `
  query {
    transactions(
      owners: ["${WALLET_ADDRESS}"]
      tags: [{ name: "Content-Type", values: ["image/jpeg", "application/json"] }]
    ) {
      edges {
        node {
          id
          tags {
            name
            value
          }
        }
      }
    }
  }
`;

async function main() {
  const response = await fetch(IRYS_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    console.error("Failed to fetch from Irys GraphQL endpoint");
    process.exit(1);
  }

  const data = await response.json();
  const edges = data?.data?.transactions?.edges || [];

  if (edges.length === 0) {
    console.log("No files found for this wallet address.");
    return;
  }

  for (const edge of edges) {
    const { id, tags } = edge.node;
    console.log(`File ID: ${id}`);
    for (const tag of tags) {
      console.log(`  ${tag.name}: ${tag.value}`);
    }
    console.log("---");
  }
}

main().catch(console.error);

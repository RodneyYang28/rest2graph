import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import pkg from "body-parser";
const { json } = pkg;

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const books = [
  {
    title: "The Awakening",
    author: {
      name: "Kate Chopin",
    },
    domain: {
      name: "sports",
    },
  },
  {
    title: "City of Glass",
    author: {
      name: "Paul Auster",
    },
    domain: {
      name: "game",
    },
  },
  {
    title: "The Awakening2",
    author: {
      name: "Kate Chopin",
    },
    domain: {
      name: "sports",
    },
  },
  {
    title: "City of Glass2",
    author: {
      name: "Paul Auster",
    },
    domain: {
      name: "game",
    },
  },
];

const domains = [
  {
    name: "d1",
    books: [
      {
        title: "book1",
        author: {
          name: "a",
        },
      },
    ],
  },
];

const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: Author
    domain: Domain
  }

  type Domain {
    name: String
    books: [Book]
  }
  type Author {
    name: String
    books: [Book]
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    books: [Book]
    domains: [Domain]
    authors : [Author]
  }
`;

const resolvers = {
  Query: {
    books: () => books,
    domains: () => domains,
    authors: () => books,
  },
};

interface MyContext {
  token?: String;
}

const app = express();
// Our httpServer handles incoming requests to our Express app.
// Below, we tell Apollo Server to "drain" this httpServer,
// enabling our servers to shut down gracefully.
const httpServer = http.createServer(app);

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();

app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  json(),
  expressMiddleware(server, {
    context: async ({ req }) => ({ token: req.headers.token }),
  })
);

app.get("/api/books", async (req, res) => {
  const response = await server.executeOperation({
    query: `
    query books {
      books {
          title
      }
    }
    `,
    // variables: { name: 'world' },
  });
  switch (response.body.kind) {
    case "single":
      res.json(response.body.singleResult.data);
      break;

    default:
      res.json(response.body);
      break;
  }
});

await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);

console.log(`🚀 Server ready at http://localhost:4000/graphql`);

import express from "express";
import { PrismaClient } from "@prisma/client";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/movies", async (_, res) => {
  const movies = await prisma.movie.findMany({
    orderBy: {
      title: "asc",
    },
    include: {
      genres: true,
      languages: true,
    },
  });
  res.json(movies);
});

app.post("/movies", async (req, res) => {
  const { title, genre_id, language_id, oscar_count, release_date } = req.body;

  try {
    // verificar no banco se já existe um filme o nome que está sendo enviado

    const movieWithSameTitle = await prisma.movie.findFirst({
      where: {
        title: { equals: title, mode: "insensitive" },
      },
    });

    if (movieWithSameTitle)
      return res
        .status(409)
        .send({ message: "Já existe um filme cadastrado com esse título" });

    await prisma.movie.create({
      data: {
        title: title,
        genre_id: genre_id,
        language_id: language_id,
        oscar_count: oscar_count,
        release_date: new Date(release_date),
      },
    });
  } catch (err) {
    return res.status(500).send({ message: "Falha ao cadastrar um filme" });
  }

  res.status(201).send();
});

app.put("/movies/:id", async (req, res) => {
  // 1.pegar o id do registro que vai ser atualizado
  const id = Number(req.params.id);

  const movie = await prisma.movie.findUnique({
    where: { id: id },
  });
  try {
    if (!movie)
      return res.status(404).send({ message: "Filme não encontrado" });

    const data = { ...req.body };
    data.release_date = data.release_date
      ? new Date(data.release_date)
      : undefined;

    // 2.pegar os dados do filme que será atualizado e atualizar ele no prisma
    await prisma.movie.update({
      where: { id: id },
      data: data,
    });
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Falha ao atualizar o registro do filme" });
  }
  // 3.retornar o status correto informando que o filme foi atualizado
  res.status(200).send();
});

app.delete("/movies/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const movie = await prisma.movie.findUnique({
      where: { id: id },
    });

    if (!movie)
      return res.status(404).send({ message: "Filme não encontrado" });

    await prisma.movie.delete({
      where: { id: id },
    });
  } catch (err) {
    return res.status(500).send({ message: "Falha ao remover filme" });
  }

  res.status(200).send();
});

app.get("/movies/:genreName", async (req, res) => {
  // 1. receber o nome do gênero pelo parametro da rota
  console.log(req.params.genreName);
  try {
    // 2. filtrar os filmes do banco pelo gênero
    const moviesFilteredByGenreName = await prisma.movie.findMany({
      where: {
        genres: {
          name: {
            equals: req.params.genreName,
            mode: "insensitive",
          },
        },
      },
      include: {
        genres: true,
        languages: true,
      },
    });
    res.status(200).send(moviesFilteredByGenreName);
  } catch (err) {
    return res
      .status(500)
      .send({ message: "Falha ao filtrar filmes por gênero" });
  }

  // 3. retornar os filmes filtrados na resposta da rota
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

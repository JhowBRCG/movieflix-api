import express from "express";
import { PrismaClient } from "@prisma/client";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

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

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

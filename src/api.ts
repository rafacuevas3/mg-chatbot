import express from 'express';
import cors from 'cors';
import axios from 'axios';

export const app = express();

app.use(cors({ origin: true }));

app.use(express.json());
app.use(express.raw({ type: 'application/vnd.custom-type' }));
app.use(express.text({ type: 'text/html' }));

// Healthcheck endpoint
app.get('/', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

const api = express.Router();

api.get('/validate', (req, res) => {
  // check if verification token is correct
  if (req.query.token !== process.env.TOKEN) {
    return res.sendStatus(401);
  }

  // print request body
  console.log(req.body);

  // return a text response
  const data = {
    responses: [
      {
        type: 'randomText',
        messages: ['Hi', 'Hello']
      }
    ]
  };

  res.json(data);
});

api.get('/hello', (req, res) => {
  res.status(200).send({ message: 'hello world' });
});

api.get('/chat', async (req, res) => {
  try {
    const model = req.query.model || 'gpt-3.5-turbo-0301';
    const temperature = req.query.temperature || 0.16;

    if (req.query.token !== process.env.TOKEN) {
      res.sendStatus(401);
    }

    const messages = [
      {
        role: 'system',
        content:
          "You are an AI Assistant specialized in Auto and Car Insurance. You can communicate effectively with people and answering their questions regarding their auto insurance needs. Your answers are based on the pages listed on this sitemap 'https://www.moneygeek.com/auto-flex-sitemap.xml'"
      },
      { role: 'user', content: req.query.message }
    ];

    const r = await axios
      .post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          temperature,
          messages
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.API_KEY}`
          }
        }
      )
      .then((response) => {
        console.log('Success fetching OpenAI');

        return response.data.choices[0].message.content;
      })
      .catch((error) => {
        console.log('Failure fetching OpenAI');
        console.log(error.message);
        console.log(error.config.headers);
      });

    res.status(200).send({
      type: 'text',
      message: r
    });
  } catch (e) {
    res.status(400).send({ message: e });
  }
});

// Version the api
app.use('/api/v1', api);

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import submissionsRoute from './routes/submissions-route.js'
import { schedulePrizeGeneration } from './services/cron-service.js'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route("/submissions", submissionsRoute);

schedulePrizeGeneration();

serve({
  fetch: app.fetch,
  port: process.env.PORT ? parseInt(process.env.PORT) : 8000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

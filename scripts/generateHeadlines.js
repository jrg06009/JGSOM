// generateHeadlines.js
import fs from 'fs'
import path from 'path'
import { OpenAI } from 'openai'

// Set your OpenRouter key here
const apiKey = process.env.OPENROUTER_API_KEY
const openai = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey })

const schedulePath = path.join(process.cwd(), 'data', 'stats', 'schedule.json')
const boxscoreDir = path.join(process.cwd(), 'data', 'boxscores')
const headlinePath = path.join(process.cwd(), 'data', 'headlines.json')

const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'))
const headlines = fs.existsSync(headlinePath) ? JSON.parse(fs.readFileSync(headlinePath, 'utf8')) : {}

async function generateHeadline(box) {
  const { home, away, home_score, away_score, date } = box.meta || {}
  if (!home || !away || home_score == null || away_score == null) return null

  const prompt = `Write a one-sentence news headline about this Strat-O-Matic baseball game:
${away} ${away_score}, ${home} ${home_score} (played on ${date})`

  try {
    const res = await openai.chat.completions.create({
      model: 'openrouter/openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 40,
    })
    return res.choices?.[0]?.message?.content?.trim() || null
  } catch (e) {
    console.error(`Error generating headline for ${away} at ${home}`, e)
    return null
  }
}

async function main() {
  for (const game of schedule) {
    if (!game.completed || !game.id || headlines[game.id]) continue
    const filePath = path.join(boxscoreDir, `${game.id}.json`)
    if (!fs.existsSync(filePath)) continue
    const box = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const headline = await generateHeadline(box)
    if (headline) headlines[game.id] = headline
  }
  fs.writeFileSync(headlinePath, JSON.stringify(headlines, null, 2))
  console.log('Headlines updated.')
}

main()

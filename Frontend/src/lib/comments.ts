import { seedComments } from '../data/data'
import { createStore } from './store'

export type Comment = {
  id: number
  recipeId: string
  name: string
  where: string
  when: string
  text: string
  rating: number
  useful: number
  liked?: boolean
}

export const comments = createStore<Comment[]>('gm:v2:comments', seedComments)

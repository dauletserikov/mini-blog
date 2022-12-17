import {Post} from './types/Post'
import {User} from './types/User'
import {
  users as mockUsers,
  posts as mockPosts
} from './mock-data'

let database: IDBDatabase
let initialized = false

async function getDatabase() {
  if (!initialized) {
    await initialize()
  }

  return database
}

function initialize() {
  return new Promise<void>(resolve => {
    const openRequest = indexedDB.open('mini-blog')

    openRequest.onupgradeneeded = () => {
      const database = openRequest.result
      database.createObjectStore('users', {keyPath: 'username'})
      database.createObjectStore('posts', {keyPath: 'id', autoIncrement: true})
    }

    openRequest.onsuccess = () => {
      database = openRequest.result
      initialized = true
      resolve()
    }
  })
}

populate()

async function populate() {
  if (localStorage.getItem('databasePopulated')) {
    return
  }

  const database = await getDatabase()
  const transaction = database.transaction(['users', 'posts'], 'readwrite')

  const users = transaction.objectStore('users')
  const posts = transaction.objectStore('posts')

  mockUsers.forEach(user => users.add(user))
  mockPosts.forEach(post => posts.add(post))

  localStorage.setItem('databasePopulated', 'true')
}

async function getObjectStore(store: string, mode: IDBTransactionMode) {
  const database = await getDatabase()
  return database.transaction(store, mode).objectStore(store)
}

export async function getPosts(): Promise<Post[]> {
  const posts = await getObjectStore('posts', 'readonly')
  const request = posts.getAll()

  return new Promise(resolve => {
    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

export async function getUsers(): Promise<Omit<User, 'password'>[]> {
  const users = await getObjectStore('users', 'readonly')
  const request = users.getAll()

  return new Promise(resolve => {
    request.onsuccess = () => {
      const users = request.result as User[]

      const usersWithPasswordOmitted: Omit<User, 'password'>[] = users.map(user => {
        const {password: _, ...userWithPasswordOmitted} = user
        return userWithPasswordOmitted
      })

      resolve(usersWithPasswordOmitted)
    }
  })
}

export async function addPost(post: Omit<Post, 'id'>): Promise<Post> {
  const posts = await getObjectStore('posts', 'readwrite')
  const request = posts.add(post)

  return new Promise(resolve => {
    request.onsuccess = async () => {
      const posts = await getObjectStore('posts', 'readonly')
      const subRequest = posts.get(request.result)

      subRequest.onsuccess = () => {
        resolve(subRequest.result)
      }
    }
  })
}

export async function getUser(username: string): Promise<User> {
  const users = await getObjectStore('users', 'readonly')
  const request = users.get(username)

  return new Promise(resolve => {
    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

export async function addUser(user: User) {
  const users = await getObjectStore('users', 'readwrite')
  users.add(user)
}

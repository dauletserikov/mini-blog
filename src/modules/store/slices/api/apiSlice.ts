import {createEntityAdapter, EntityState, createSelector} from '@reduxjs/toolkit'
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'
import {configuration} from '../../../server/configuration'
import {Post} from '../../../types/Post'
import {User} from '../../../types/User'
import {User as ServerUser} from '../../../types/server/User'
import {RootState} from '../../store'
import {LoginCredential} from '../../../types/LoginCredential'
import {ApiResponse, isApiResponse} from '../../../types/Response'
import {PostFields} from '../../../components/AddPostModal/AddPostModal'
import {AddPostApiResponse} from '../../../types/AddPostApiResponse'

const postsAdapter = createEntityAdapter<Post>({
  sortComparer: (a, b) => b.publicationDate.localeCompare(a.publicationDate)
})
const usersAdapter = createEntityAdapter<User>({
  selectId: (user) => user.username
})

const postsInitialState = postsAdapter.getInitialState()
const usersInitialState = usersAdapter.getInitialState()

export const apiSlice = createApi({
  baseQuery: fetchBaseQuery({baseUrl: configuration.apiPrefix}),
  endpoints: builder => ({
    getPosts: builder.query<EntityState<Post>, void>({
      query: () => '/posts',
      transformResponse: (response) => {
        return postsAdapter.setAll(postsInitialState, response as Post[])
      }
    }),
    getUsers: builder.query<EntityState<User>, void>({
      query: () => '/users',
      transformResponse: (response) => {
        return usersAdapter.setAll(usersInitialState, response as User[])
      }
    }),
    getCurrentUser: builder.query<string | undefined, void>({
      query: () => '/currentUser',
      transformResponse(response) {
        if (isApiResponse(response) && response.status === 'success') {
          return response.data!
        }

        return undefined
      }
    }),
    login: builder.mutation<ApiResponse, LoginCredential>({
      query: (data) => ({
        url: '/login',
        method: 'POST',
        body: data
      }),
      async onCacheEntryAdded({username}, {dispatch, cacheDataLoaded}) {
        const cache = await cacheDataLoaded
        if (cache.data.status === 'success') {
          dispatch(apiSlice.util.upsertQueryData('getCurrentUser', undefined, username))
        }
      }
    }),
    register: builder.mutation<ApiResponse, ServerUser>({
      query: (data) => ({
        url: '/register',
        method: 'POST',
        body: data
      }),
      async onCacheEntryAdded({username}, {dispatch, cacheDataLoaded}) {
        const cache = await cacheDataLoaded
        if (cache.data.status === 'success') {
          dispatch(apiSlice.util.upsertQueryData('getCurrentUser', undefined, username))
        }
      }
    }),
    addPost: builder.mutation<AddPostApiResponse, PostFields>({
      query: (data) => ({
        url: '/addPost',
        method: 'POST',
        body: data
      }),
      async onCacheEntryAdded(_, {dispatch, cacheDataLoaded}) {
        const cache = await cacheDataLoaded
        if (cache.data.status === 'success') {
          dispatch(
            // TODO rewrite
            apiSlice.util.updateQueryData('getPosts', undefined, draft => {
              console.log(draft)
              if (typeof cache.data.data !== 'string') {
                postsAdapter.addOne(draft, cache.data.data!)
              }
            })
          )
        }
      }
    })
  })
})

export const {
  useGetPostsQuery,
  useGetUsersQuery,
  useLoginMutation,
  useGetCurrentUserQuery,
  useRegisterMutation,
  useAddPostMutation
} = apiSlice

export const {
  selectById: selectPostById,
  selectIds: selectPostIds,
  selectAll: selectAllPosts
} = postsAdapter.getSelectors<RootState>(state => {
  return apiSlice.endpoints.getPosts.select()(state).data ?? postsInitialState
})

export const {
  selectById: selectUserById,
  selectIds: selectUserIds
} = usersAdapter.getSelectors<RootState>(state => {
  return apiSlice.endpoints.getUsers.select()(state).data ?? usersInitialState
})

export const selectPostIdsByUser = createSelector(
  [selectAllPosts, selectUserById],
  (posts, author) => {
    if (!author) return []

    const postsFiltered = posts.filter(post => post.author === author.username)
    return postsFiltered.map(post => post.id)
  }
)
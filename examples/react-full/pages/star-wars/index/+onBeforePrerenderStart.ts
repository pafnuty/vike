// https://vike.dev/onBeforePrerenderStart
export { onBeforePrerenderStart }

import type { OnBeforePrerenderStartAsync } from 'vike/types'
import type { Data as DataMovies } from './+data'
import type { Data as DataMovie } from '../@id/+data'
import { filterMovieData } from '../filterMovieData'
import { filterMoviesData, getStarWarsMovies, getTitle } from './getStarWarsMovies'

type Data = DataMovie | DataMovies

const onBeforePrerenderStart: OnBeforePrerenderStartAsync<Data> = async (): ReturnType<
  OnBeforePrerenderStartAsync<Data>
> => {
  const movies = await getStarWarsMovies()

  return [
    {
      url: '/star-wars',
      // We already provide `pageContext` here so that Vike
      // will *not* have to call the `data()` hook defined
      // above in this file.
      pageContext: {
        data: {
          movies: filterMoviesData(movies),
          title: getTitle(movies)
        }
      }
    },
    ...movies.map((movie) => {
      const url = `/star-wars/${movie.id}`
      return {
        url,
        // Note that we can also provide the `pageContext` of other pages.
        // This means that Vike will not call any
        // `data()` hook and the Star Wars API will be called
        // only once (in this `prerender()` hook).
        pageContext: {
          data: {
            movie: filterMovieData(movie),
            title: movie.title
          }
        }
      }
    })
  ]
}

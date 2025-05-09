import fs from 'fs'
console.log('Listing contents of components folder:', fs.readdirSync('./components'))

import '../styles/globals.css'
import Layout from '../components/Layout'


export default function App({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}

import '../styles/globals.css'
import Layout from '../components/Layout'


<div className="w-full max-w-screen px-4 sm:px-6 lg:px-8">
  export default function App({ Component, pageProps }) {
    return (
      <Layout>
        <Component {...pageProps} />
      </Layout>
    )
  }
</div>

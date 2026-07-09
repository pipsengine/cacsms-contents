import Sidebar from './sidebar'

export default function HomePage() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content">
        <section>
          <h1>Welcome to CACSMS Contents</h1>
          <p>Select a module from the sidebar to get started.</p>
        </section>
      </main>
    </div>
  )
}

import { render } from 'solid-js/web'
import { Router, Route } from '../src'

let app = document.getElementById('app')

render(() => (
  <Router>
    <Route path="/route" component={() => <h1>Hello</h1>} />
  </Router>
), app!)

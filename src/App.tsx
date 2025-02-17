import Footer from "./components/Footer";
import Switch from "./components/Switch";
import Background from "./components/Background";
import Menu from "./components/Menu";
import "./App.css";

function App() {
  return (
    <div>
      <div className="app-container">
        <Background />
        <div className="app-switch-container">
          <Switch></Switch>
        </div>
        <div className="app-menu-container">
          <Menu />
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
}

export default App;

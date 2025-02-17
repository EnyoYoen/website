import Footer from "./components/Footer";
import Switch from "./components/Switch";
import Background, {
  BackgroundPlanetTransition,
  BackgroundMenuTransition,
  isBackgroundZoomed,
} from "./components/Background";
import Menu from "./components/Menu";
import "./App.css";

function App() {
  const callback = (button: number) => {
    // TODO: just a placeholder to see if the menu transitions works
    if (isBackgroundZoomed()) BackgroundMenuTransition();
    else BackgroundPlanetTransition(button);
  };

  return (
    <div>
      <div className="app-container">
        <Background />
        <div className="app-switch-container">
          <Switch></Switch>
        </div>
        <div className="app-menu-container">
          <Menu callback={callback} />
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
}

export default App;

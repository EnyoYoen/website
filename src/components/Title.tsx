import "./Title.css";

function Title() {
  return (
    <>
      <div className="title-container h-screen flex items-center justify-center">
        <h2 className="title">Un titre long très très long</h2>
        <hr />
        <div className="text-effect-wrapper">
          <h1 className="text" contentEditable>
            WOUAH
          </h1>
        </div>
      </div>
    </>
  );
}

export default Title;

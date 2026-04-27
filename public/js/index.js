'use strict';

var fx = {
  limitUnit: function limitUnit(x) {
    return x < 0 ? 0 : x < 1 ? x : 1;
  }
};

var Gradient = React.createClass({
  displayName: 'Gradient',
  render: function render() {
    var x = this.props.x;

    return React.createElement('div', {
      style: {
        width: '100vw',
        height: 2000,
        background: this.props.background,
        left: this.props.left,
        position: 'absolute',
        top: 0
      }
    });
  }
});

var App = React.createClass({
  displayName: 'App',
  getInitialState: function getInitialState() {
    return {
      x : 0
    };
  },
  appStyle: {
    height: 2000
  },
  handleScroll: function handleScroll(e) {
    var x = fx.limitUnit(window.scrollY / (this.appStyle.height - window.innerHeight));
    this.setState({
      x: x,
    });
  },

  componentDidMount: function componentDidMount() {
    this.container = document.getElementsByClassName('main');
    var handler = this.handleScroll;
    window.addEventListener('scroll', handler);
  },

  render: function render() {
    var x = this.state.x;
    var planeX = fx.limitUnit(x);
    return React.createElement( 'div', {
      className: 'app',
      style: this.appStyle
    },
    React.createElement( 'div', {
      className: 'container'
    },
    React.createElement( Gradient, {
      background: 'linear-gradient(' + (x * 1000) + 'deg,#a9b4ff, #c9ffa9, #d7a9ff, #a9fff3, #ff6d95, #8aff6d, #6dedff, #1c6afe, #cbfe1c, #fe7e1c, #ff0068, #9f00ff, #00ff97)',
      left: '0%',
      width: '100%',
      x: x * 100
    })
  ));
  }
});

ReactDOM.render(React.createElement(App, null), document.getElementById('app'));

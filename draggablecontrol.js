import PropTypes from 'prop-types';
import BaseControl from './base-control';

const propTypes = Object.assign({}, BaseControl.propTypes, {
  draggable: PropTypes.bool,
  onDrag: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDragStart: PropTypes.func
});

const defaultProps = Object.assign({}, BaseControl.defaultProps, {
  draggable: false
});

export default class DraggableControl extends BaseControl {
  constructor(props) {
    super(props);
    this.state = {
      dragPos: null,
      dragOffset: null
    };
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this._removeDragEvents();
  }

  _setupDragEvents() {
    const {eventManager} = this.context;
    if (!eventManager) {
      return;
    }

    // panstart is already attached by parent class BaseControl,
    // here we just add listeners for subsequent drag events
    this._dragEvents = {
      panmove: this._onDrag.bind(this),
      panend: this._onDragEnd.bind(this),
      pancancel: this._onDragCancel.bind(this)
    };
    eventManager.on(this._dragEvents);
  }

  _removeDragEvents() {
    const {eventManager} = this.context;
    if (!eventManager || !this._dragEvents) {
      return;
    }
    eventManager.off(this._dragEvents);
    this._dragEvents = null;
  }

  _getDragEventPosition(event) {
    const {offsetCenter: {x, y}} = event;
    return [x, y];
  }

  /**
   * Returns offset of top-left of marker from drag start event
   * (used for positioning marker relative to next mouse coordinates)
   */
  _getDragEventOffset(event) {
    const {center: {x, y}} = event;
    const rect = this._containerRef.getBoundingClientRect();
    return [rect.left - x, rect.top - y];
  }

  _getDraggedPosition(dragPos, dragOffset) {
    return [
      dragPos[0] + dragOffset[0],
      dragPos[1] + dragOffset[1]
    ];
  }

  _getDragLngLat(dragPos, dragOffset) {
    return this.context.viewport.unproject(
      this._getDraggedPosition(dragPos, dragOffset)
    );
  }

  _onDragStart(event) {
    const {draggable, captureDrag} = this.props;
    if (draggable || captureDrag) {
      event.stopPropagation();
    }
    if (!draggable) {
      return;
    }

    const dragPos = this._getDragEventPosition(event);
    const dragOffset = this._getDragEventOffset(event);
    this.setState({dragPos, dragOffset});
    this._setupDragEvents();

    if (this.props.onDragStart) {
      event.lngLat = this._getDragLngLat(dragPos, dragOffset);
      this.props.onDragStart(event);
    }
  }

  _onDrag(event) {
    event.stopPropagation();

    const dragPos = this._getDragEventPosition(event);
    this.setState({dragPos});

    if (this.props.onDrag) {
      event.lngLat = this._getDragLngLat(dragPos, this.state.dragOffset);
      this.props.onDrag(event);
    }
  }

  _onDragEnd(event) {
    const {dragPos, dragOffset} = this.state;

    event.stopPropagation();
    this.setState({dragPos: null, dragOffset: null});
    this._removeDragEvents();

    if (this.props.onDragEnd) {
      event.lngLat = this._getDragLngLat(dragPos, dragOffset);
      this.props.onDragEnd(event);
    }
  }

  _onDragCancel(event) {
    event.stopPropagation();
    this.setState({dragPos: null, dragOffset: null});
    this._removeDragEvents();
  }

  render() {
    return null;
  }

}

DraggableControl.propTypes = propTypes;
DraggableControl.defaultProps = defaultProps;

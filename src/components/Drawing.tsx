import * as React from 'react';
import CanvasDraw from 'react-canvas-draw';

interface IDrawingProps {
	refCanva: React.LegacyRef<CanvasDraw>;
}

const Drawing: React.FunctionComponent<IDrawingProps> = props => {
	const { refCanva } = props;
	return <CanvasDraw className="shadow-2xl" brushColor="#000" ref={refCanva} />;
};

export default Drawing;

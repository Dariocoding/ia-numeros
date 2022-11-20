import * as React from 'react';
import CanvasDraw from 'react-canvas-draw';
import { loadLayersModel, LayersModel, tensor4d } from '@tensorflow/tfjs';
import Drawing from './Drawing';

interface IRootAppProps {}

function resample_single(canvas, width, height, resize_canvas) {
	var width_source = canvas.width;
	var height_source = canvas.height;
	width = Math.round(width);
	height = Math.round(height);

	var ratio_w = width_source / width;
	var ratio_h = height_source / height;
	var ratio_w_half = Math.ceil(ratio_w / 2);
	var ratio_h_half = Math.ceil(ratio_h / 2);

	var ctx = canvas.getContext('2d');
	var ctx2 = resize_canvas.getContext('2d');
	var img = ctx.getImageData(0, 0, width_source, height_source);
	var img2 = ctx2.createImageData(width, height);
	var data = img.data;
	var data2 = img2.data;

	for (var j = 0; j < height; j++) {
		for (var i = 0; i < width; i++) {
			var x2 = (i + j * width) * 4;
			var weight = 0;
			var weights = 0;
			var weights_alpha = 0;
			var gx_r = 0;
			var gx_g = 0;
			var gx_b = 0;
			var gx_a = 0;
			var center_y = (j + 0.5) * ratio_h;
			var yy_start = Math.floor(j * ratio_h);
			var yy_stop = Math.ceil((j + 1) * ratio_h);
			for (var yy = yy_start; yy < yy_stop; yy++) {
				var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
				var center_x = (i + 0.5) * ratio_w;
				var w0 = dy * dy; //pre-calc part of w
				var xx_start = Math.floor(i * ratio_w);
				var xx_stop = Math.ceil((i + 1) * ratio_w);
				for (var xx = xx_start; xx < xx_stop; xx++) {
					var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
					var w = Math.sqrt(w0 + dx * dx);
					if (w >= 1) {
						//pixel too far
						continue;
					}
					//hermite filter
					weight = 2 * w * w * w - 3 * w * w + 1;
					var pos_x = 4 * (xx + yy * width_source);
					//alpha
					gx_a += weight * data[pos_x + 3];
					weights_alpha += weight;
					//colors
					if (data[pos_x + 3] < 255)
						weight = (weight * data[pos_x + 3]) / 250;
					gx_r += weight * data[pos_x];
					gx_g += weight * data[pos_x + 1];
					gx_b += weight * data[pos_x + 2];
					weights += weight;
				}
			}
			data2[x2] = gx_r / weights;
			data2[x2 + 1] = gx_g / weights;
			data2[x2 + 2] = gx_b / weights;
			data2[x2 + 3] = gx_a / weights_alpha;
		}
	}

	ctx2.putImageData(img2, 0, 0); //Obtenemos la imagen del número dibujado
}

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const RootApp: React.FunctionComponent<IRootAppProps> = props => {
	const refCanva = React.useRef<CanvasDraw>(null);
	const [modelo, setModelo] = React.useState<LayersModel>();
	const [numero, setNumero] = React.useState(null);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		async function onLoad() {
			setLoading(true);
			loadLayersModel;
			const model = await loadLayersModel('model.json');
			setModelo(model);
			setLoading(false);
		}

		onLoad();
	}, []);

	const onCleanDraw = () => {
		refCanva.current?.clear();
		setNumero(null);
	};

	const onClickResult = async () => {
		if (!modelo) return null;
		const canvaElementDrawing: HTMLCanvasElement =
			// @ts-ignore
			refCanva.current.canvasContainer.children[1];
		resample_single(canvaElementDrawing, 28, 28, canvas);
		const imgData = ctx?.getImageData(0, 0, 28, 28);
		var arr = []; //El arreglo completo
		var arr28 = []; //Al llegar a 28 posiciones se pone en 'arr' como un nuevo indice
		for (var p = 0, i = 0; p < imgData.data.length; p += 4) {
			var valor = imgData.data[p + 3] / 255; //Vamos normalizando los valores de la imagen para ponerlos entre 0 y 1
			arr28.push([valor]); //Agregar al arr28 ya normalizado a 0-1
			if (arr28.length == 28) {
				arr.push(arr28);
				arr28 = [];
			}
		}

		const tensor4 = tensor4d([arr]); //Creamos un tensor de 4 dimensiones para 1, 28, 28, 1
		//@ts-ignore
		const resultados = modelo.predict(tensor4).dataSync(); //Llamamos a la función de predicción
		const mayorIndice = resultados.indexOf(Math.max.apply(null, resultados)); //Obtenemos el valor con mayor índice
		refCanva.current?.clear();
		setNumero(mayorIndice);
	};

	return (
		<div className="flex items-center justify-center h-screen flex-col">
			<h1
				style={{
					textShadow: `0px 15px 5px rgba(0,0,0,0.1),
                 10px 20px 5px rgba(0,0,0,0.05),
                 -10px 20px 5px rgba(0,0,0,0.05)`,
				}}
				className="mb-28 text-6xl text-white text-center bg-clip-text bg-gradient-to-r from-green-100 to-indigo-200 font-extrabold text-transparent"
			>
				Proyecto Redes Neuronales: <br /> IA reconocimiento de numeros
			</h1>
			<Drawing refCanva={refCanva} />

			<div className="btn-group mt-8">
				<div className="btn btn-warning" onClick={onCleanDraw}>
					Clean
				</div>
				<div className="btn btn-primary" onClick={onClickResult}>
					¿Qué número es?
				</div>
			</div>

			{numero !== null && <h6 className="mt-8 text-4xl text-white">{numero}</h6>}
		</div>
	);
};

export default RootApp;

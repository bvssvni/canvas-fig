
function newFig(id) {
	var box = document.getElementById(id);
	var ctx = box.getContext("2d");
	var fig = {};
	var shapes = [];
	var fill_styles = [];
	var fill_style_default = "#bbbbbb";
	var strokeStyles = [];
	var stroke_style_default = null;
	var line_widths = [];
	var line_width_default = 1;
	var transforms = [];
	var transform_default = [1,0, 0,1, 0,0];
	var positions = [];
	var position_default = [0, 0];
	var rotations = [];
	var rotation_default = 0;
	var scales = [];
	var scale_default = [1,1];
	var visible = [];
	var visible_default = true;
	var cursor = 0;
	var type_rect = 1;
	var type_group = 2;
	var arrs = [fill_styles,
				strokeStyles,
				line_widths,
				transforms,
				positions,
				rotations,
				scales,
				visible];
	var default_values = [fill_style_default,
						  stroke_style_default,
						  line_width_default,
						  transform_default,
						  position_default,
						  rotation_default,
						  scale_default,
						  visible_default];
	
	var apply = function(arr, defaultValue) {
		for (var i = arr.length; i < shapes.length; i++) {
			arr.push(defaultValue);
		}
	}
	
	var multiplyMatrices = function(a, b) {
		return [
				a[0]*b[0] + a[2]*b[1],
				a[1]*b[0] + a[3]*b[1],
				a[0]*b[2] + a[2]*b[3],
				a[1]*b[2] + a[3]*b[3],
				a[0]*b[4] + a[2]*b[5] + a[4],
				a[1]*b[4] + a[3]*b[5] + a[5]
				];
	}
	
	fig.getContext = function() {
		return ctx;
	}
	
	fig.addRect = function(x, y, w, h) {
		shapes.push({type: type_rect, x: x, y: y, w: w, h: h});
		return shapes.length - 1;
	}
	
	fig.addGroup = function(name, gr) {
		shapes.push({type: type_group, name: name, members: gr});
		return shapes.length - 1;
	}
	
	var setGroupVal = function(arr, shape, val) {
		if (shape.type != type_group) {
			return;
		}
		
		var members = shape.members;
		var n = members.length / 2;
		for (var i = 0; i < n; i++) {
			var start = members[2*i];
			var end = members[2*i+1];
			for (var j = start; j < end; j++) {
				if (shapes[j].type === type_group && arr[j] !== val) {
					setGroupVal(arr, shapes[j], val);
				}
				arr[j] = val;
			}
		}
	}
	
	var setVal = function(arr, val) {
		for (var i = cursor; i < shapes.length; i++) {
			if (arr.length <= i) {
				arr.push(val);
			} else {
				arr[i] = val;
			}
			
			// Propagate the changes to the group.
			var shape = shapes[i];
			setGroupVal(arr, shape, val);
		}
	}
	
	var groupOperation = function(shape, op) {
		if (shape.type != type_group) {
			return;
		}
		
		var members = shape.members;
		var n = members.length / 2;
		for (var i = 0; i < n; i++) {
			var start = members[2*i];
			var end = members[2*i+1];
			for (var j = start; j < end; j++) {
				if (shapes[j].type === type_group) {
					groupOperation(shapes[j], op);
				}
				op(j);
			}
		}
	}
	
	var operation = function(op) {
		for (var i = cursor; i < shapes.length; i++) {
			op(i);
			
			// Propagate the changes to the group.
			var shape = shapes[i];
			groupOperation(shape, op);
		}
	}
	
	fig.setVisible = function(isVisible) {
		setVal(visible, isVisible);
	}
	
	fig.setTranslation = function(x, y) {
		setVal(transforms, [1,0, 0,1, x,y]);
	}
	
	fig.setPosition = function(x, y) {
		setVal(positions, [x, y]);
	}
	
	fig.changePosition = function(x, y) {
		apply(positions, position_default);
		var op = function(i) {
			var pos = positions[i];
			positions[i] = [pos[0]+x, pos[1]+y];
		};
		operation(op);
	}
	
	var rotationMatrix = function(angleInDegrees) {
		var angle = angleInDegrees / 180 * Math.PI;
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		return [cos, sin, -sin, cos, 0, 0];
	}
	
	fig.setRotationDegrees = function(angleInDegrees) {
		var angle = angleInDegrees / 180 * Math.PI;
		setVal(rotations, angle);
	}
	
	fig.setRotationRadians = function(angle) {
		setVal(rotations, angle);
	}
	
	fig.changeRotationDegrees = function(angleInDegrees) {
		apply(rotations, rotation_default);
		var angle = angleInDegrees / 180 * Math.PI;
		var op = function(i) {
			rotations[i] += angle;
		}
		operation(op);
	}
	
	fig.changeRotationRadians = function(angle) {
		apply(rotations, rotation_default);
		var op = function(i) {
			rotations[i] += angle;
		}
		operation(op);
	}
	
	fig.setScale = function(sx, sy) {
		setVal(scales, [sx, sy]);
	}
	
	fig.changeScale = function(sx, sy) {
		apply(scales, scale_default);
		var op = function(i) {
			var scale = scales[i];
			scales[i] = [scale[0]*sx, scale[1]*sy];
		}
		operation(op);
	}
	
	fig.setFillStyle = function(style) {
		setVal(fill_styles, style);
	}
	
	fig.setFillTransparent = function() {
		setVal(fill_styles, null);
	}
	
	fig.setStrokeStyle = function(style) {
		setVal(strokeStyles, style);
	}
	
	fig.setLineWidth = function(lineWidth) {
		setVal(line_widths, lineWidth);
	}
	
	fig.setLike = function(j) {
		for (var i = 0; i < arrs.length; i++) {
			setVal(arrs[i], arrs[i][j]);
		}
	}
	
	fig.append = function() {
		for (var i = 0; i < arrs.length; i++) {
			apply(arrs[i], default_values[i]);
		}
		cursor = shapes.length;
	}
	
	var cancelArr = function(arr) {
		arr.splice(cursor, arr.length - cursor);
	}
	
	fig.cancel = function() {
		cancelArr(shapes);
		for (var i = 0; i < arrs.length; i++) {
			cancelArr(arrs[i]);
		}
	}
	
	var fillShape = function(shape) {
		var type = shape.type;
		switch (type) {
			case type_rect:
				ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
				break;
		}
	}
	
	var strokeShape = function(shape) {
		var type = shape.type;
		switch (type) {
			case type_rect:
				ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
				break;
		}
	}
	
	fig.render = function() {
		for (var i = 0; i < cursor; i++) {
			var vis = visible[i];
			if (!vis) continue;
			
			ctx.save();
			var mat = transforms[i];
			ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
			
			var pos = positions[i];
			ctx.translate(pos[0], pos[1]);
			
			var rotation = rotations[i];
			ctx.rotate(rotation);
			
			var scale = scales[i];
			ctx.scale(scale[0], scale[1]);
			
			var shape = shapes[i];
			var lineWidth = line_widths[i];
			ctx.lineWidth = lineWidth;
			var fillStyle = fill_styles[i];
			if (fillStyle != null) {
				ctx.fillStyle = fillStyle;
				fillShape(shape);
			}
			var strokeStyle = strokeStyles[i];
			if (strokeStyle != null) {
				ctx.strokeStyle = strokeStyle;
				strokeShape(shape);
			}
			ctx.restore();
		}
	}
	
	return fig;
}
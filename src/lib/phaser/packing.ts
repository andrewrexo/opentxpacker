/**
 * Rectangle packing algorithms for texture atlas generation.
 *
 * Implements MaxRects bin packing with multiple heuristics based on
 * Jukka Jylänki's "A Thousand Ways to Pack the Bin" survey, plus a
 * basic shelf algorithm as fallback.
 */

export interface Rectangle {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface PackedResult {
	x: number;
	y: number;
	width: number;
	height: number;
}

export type MaxRectsHeuristic =
	| 'BestShortSideFit'
	| 'BestLongSideFit'
	| 'BestAreaFit'
	| 'BottomLeftRule'
	| 'ContactPointRule';

export type PackingAlgorithm = 'MaxRects' | 'Basic';

export interface PackerOptions {
	algorithm: PackingAlgorithm;
	heuristic: MaxRectsHeuristic;
	width: number;
	height: number;
	padding: number;
}

/**
 * MaxRects bin packer.
 * Maintains a list of free rectangles and uses heuristics to choose
 * the best placement for each incoming rectangle.
 */
export class MaxRectsPacker {
	private freeRects: Rectangle[] = [];
	private usedRects: Rectangle[] = [];
	private width: number;
	private height: number;
	private padding: number;
	private heuristic: MaxRectsHeuristic;

	constructor(options: Omit<PackerOptions, 'algorithm'>) {
		this.width = options.width;
		this.height = options.height;
		this.padding = options.padding;
		this.heuristic = options.heuristic;
		this.init();
	}

	init() {
		this.freeRects = [{ x: 0, y: 0, width: this.width, height: this.height }];
		this.usedRects = [];
	}

	resize(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.init();
	}

	/**
	 * Find the best position for a rectangle of the given size.
	 * Returns null if no space is available.
	 */
	findPosition(width: number, height: number): PackedResult | null {
		const paddedW = width + this.padding * 2;
		const paddedH = height + this.padding * 2;

		let bestRect: Rectangle | null = null;
		let bestScore1 = Infinity;
		let bestScore2 = Infinity;

		for (const freeRect of this.freeRects) {
			// Try placing without rotation
			if (freeRect.width >= paddedW && freeRect.height >= paddedH) {
				const scores = this.score(freeRect, paddedW, paddedH);
				if (
					scores[0] < bestScore1 ||
					(scores[0] === bestScore1 && scores[1] < bestScore2)
				) {
					bestScore1 = scores[0];
					bestScore2 = scores[1];
					bestRect = {
						x: freeRect.x,
						y: freeRect.y,
						width: paddedW,
						height: paddedH
					};
				}
			}
		}

		if (!bestRect) return null;

		// Split free rectangles around the placed rect
		this.splitFreeRects(bestRect);
		this.pruneFreeRects();
		this.usedRects.push(bestRect);

		// Return inner position (offset by padding)
		return {
			x: bestRect.x + this.padding,
			y: bestRect.y + this.padding,
			width,
			height
		};
	}

	/**
	 * Mark a rectangle as used without going through heuristic selection.
	 * Used when loading project files with known positions.
	 */
	markUsed(rect: Rectangle) {
		this.splitFreeRects(rect);
		this.pruneFreeRects();
		this.usedRects.push(rect);
	}

	/**
	 * Score a placement according to the current heuristic.
	 * Lower scores are better. Returns [primary, secondary] scores.
	 */
	private score(freeRect: Rectangle, width: number, height: number): [number, number] {
		const leftoverX = freeRect.width - width;
		const leftoverY = freeRect.height - height;
		const shortSide = Math.min(leftoverX, leftoverY);
		const longSide = Math.max(leftoverX, leftoverY);

		switch (this.heuristic) {
			case 'BestShortSideFit':
				return [shortSide, longSide];

			case 'BestLongSideFit':
				return [longSide, shortSide];

			case 'BestAreaFit':
				return [freeRect.width * freeRect.height - width * height, shortSide];

			case 'BottomLeftRule':
				return [freeRect.y + height, freeRect.x];

			case 'ContactPointRule':
				return [-this.contactPointScore(freeRect.x, freeRect.y, width, height), 0];

			default:
				return [shortSide, longSide];
		}
	}

	/**
	 * Calculate how much of the placed rectangle's perimeter touches
	 * existing rectangles or the bin edges. Higher is better (negated in score).
	 */
	private contactPointScore(x: number, y: number, width: number, height: number): number {
		let score = 0;

		// Contact with bin edges
		if (x === 0) score += height;
		if (y === 0) score += width;
		if (x + width === this.width) score += height;
		if (y + height === this.height) score += width;

		// Contact with other placed rectangles
		for (const used of this.usedRects) {
			// Left edge touching right edge of used rect
			if (used.x + used.width === x || x + width === used.x) {
				const overlapY = Math.min(y + height, used.y + used.height) - Math.max(y, used.y);
				if (overlapY > 0) score += overlapY;
			}
			// Top edge touching bottom edge of used rect
			if (used.y + used.height === y || y + height === used.y) {
				const overlapX = Math.min(x + width, used.x + used.width) - Math.max(x, used.x);
				if (overlapX > 0) score += overlapX;
			}
		}

		return score;
	}

	/**
	 * Split all free rectangles that intersect with the placed rect
	 * into up to 4 new sub-rectangles each.
	 */
	private splitFreeRects(usedRect: Rectangle) {
		const newFreeRects: Rectangle[] = [];

		for (let i = 0; i < this.freeRects.length; i++) {
			const free = this.freeRects[i];

			if (!this.intersects(usedRect, free)) {
				newFreeRects.push(free);
				continue;
			}

			// Space above
			if (usedRect.y > free.y) {
				newFreeRects.push({
					x: free.x,
					y: free.y,
					width: free.width,
					height: usedRect.y - free.y
				});
			}

			// Space below
			if (usedRect.y + usedRect.height < free.y + free.height) {
				newFreeRects.push({
					x: free.x,
					y: usedRect.y + usedRect.height,
					width: free.width,
					height: free.y + free.height - (usedRect.y + usedRect.height)
				});
			}

			// Space to the left
			if (usedRect.x > free.x) {
				newFreeRects.push({
					x: free.x,
					y: free.y,
					width: usedRect.x - free.x,
					height: free.height
				});
			}

			// Space to the right
			if (usedRect.x + usedRect.width < free.x + free.width) {
				newFreeRects.push({
					x: usedRect.x + usedRect.width,
					y: free.y,
					width: free.x + free.width - (usedRect.x + usedRect.width),
					height: free.height
				});
			}
		}

		this.freeRects = newFreeRects;
	}

	/**
	 * Remove any free rectangle fully contained within another.
	 */
	private pruneFreeRects() {
		const rects = this.freeRects.filter((r) => r.width > 0 && r.height > 0);

		for (let i = rects.length - 1; i >= 0; i--) {
			for (let j = 0; j < rects.length; j++) {
				if (i !== j && this.contains(rects[j], rects[i])) {
					rects.splice(i, 1);
					break;
				}
			}
		}

		this.freeRects = rects;
	}

	private intersects(a: Rectangle, b: Rectangle): boolean {
		return !(
			a.x >= b.x + b.width ||
			a.x + a.width <= b.x ||
			a.y >= b.y + b.height ||
			a.y + a.height <= b.y
		);
	}

	private contains(outer: Rectangle, inner: Rectangle): boolean {
		return (
			inner.x >= outer.x &&
			inner.y >= outer.y &&
			inner.x + inner.width <= outer.x + outer.width &&
			inner.y + inner.height <= outer.y + outer.height
		);
	}

	/** Get the current occupancy ratio (0-1). */
	getOccupancy(): number {
		let usedArea = 0;
		for (const r of this.usedRects) {
			usedArea += r.width * r.height;
		}
		return usedArea / (this.width * this.height);
	}
}

/**
 * Basic shelf packer — simpler but less space-efficient.
 * Places rectangles left-to-right on horizontal shelves, opening
 * a new shelf when the current one runs out of horizontal space.
 */
export class BasicShelfPacker {
	private width: number;
	private height: number;
	private padding: number;
	private currentX = 0;
	private currentY = 0;
	private shelfHeight = 0;

	constructor(options: Omit<PackerOptions, 'algorithm' | 'heuristic'>) {
		this.width = options.width;
		this.height = options.height;
		this.padding = options.padding;
	}

	init() {
		this.currentX = 0;
		this.currentY = 0;
		this.shelfHeight = 0;
	}

	resize(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.init();
	}

	findPosition(width: number, height: number): PackedResult | null {
		const paddedW = width + this.padding * 2;
		const paddedH = height + this.padding * 2;

		// Check if fits on current shelf
		if (this.currentX + paddedW > this.width) {
			// Move to next shelf
			this.currentY += this.shelfHeight;
			this.currentX = 0;
			this.shelfHeight = 0;
		}

		// Check if fits vertically
		if (this.currentY + paddedH > this.height) {
			return null;
		}

		const result: PackedResult = {
			x: this.currentX + this.padding,
			y: this.currentY + this.padding,
			width,
			height
		};

		this.currentX += paddedW;
		this.shelfHeight = Math.max(this.shelfHeight, paddedH);

		return result;
	}

	markUsed(_rect: Rectangle) {
		// No-op for shelf packer — positions are sequential
	}
}

/**
 * Factory: create a packer instance based on options.
 */
export function createPacker(options: PackerOptions): MaxRectsPacker | BasicShelfPacker {
	if (options.algorithm === 'Basic') {
		return new BasicShelfPacker(options);
	}
	return new MaxRectsPacker(options);
}

const REQUIRED = [
	{ "type": 5000, "required": 10, "unit": "pieces" },
	{ "type": 1000, "required": 20, "unit": "pieces" },
	{ "type": 500,  "required": 1,  "unit": "sticks" },
	{ "type": 100,  "required": 2,  "unit": "sticks" },
	{ "type": 50,   "required": 1,  "unit": "sticks" },
	{ "type": 10,   "required": 2,  "unit": "sticks" },
	{ "type": 5,    "required": 1,  "unit": "sticks" },
	{ "type": 1,    "required": 1,  "unit": "sticks" }
];

class Layout {
	constructor(table, style = {}, event = {}) {
		this.table = table; this.style = style; this.event = event;
	}
	ApplyStyles() {
		let Style = this.style;
		const Row = new UITableRow();
		if (Style.body.background) Row.backgroundColor = Style.body.background;
		if (Style.body.height) Row.height = Style.body.height;
		if (Style.body.spacer) Row.cellSpacing = Style.body.spacer;
		if (Style.body.onSelect && Style.body.onSelect.select) {
			Row.onSelect = this.event[Style.body.onSelect.id];
			Row.dismissOnSelect = Style.body.onSelect.dismiss;
		}
		let Sorted = Object.keys(Style).sort((a, b) => {
			const NumA = parseInt(a.slice(3), 10);
			const NumB = parseInt(b.slice(3), 10);
			return NumA - NumB;
		});
		Style = Object.fromEntries(Sorted.map(key => [key, Style[key]]));
		for (let [item, value] of Object.entries(Style)) {
			let Content;
			switch (item.slice(0, 3)) {
				case "txt": Content = Row.addText(value.text[0], value.text[1]);break;
				case "btn": Content = Row.addButton(value.title);break;
				case "img":
					if (value.url) Content = Row.addImageAtURL(value.url);
					if (value.image) Content = Row.addImage(value.image);break;
			}
			if (value.color) {Content.titleColor = value.color[0];Content.subtitleColor = value.color[1];}
			if (value.font) {Content.titleFont = value.font[0];Content.subtitleFont = value.font[1];}
			if (value.id) Content.onTap = this.event[value.id];
			if (value.dismiss) Content.dismissOnTap = value.dismiss;
			if (value.widthWeight) Content.widthWeight = value.widthWeight;
			if (value.align) {
				switch (value.align) {
					case "right": Content.rightAligned();break;
					case "left": Content.leftAligned();break;
					case "center": Content.centerAligned();break;
				}
			}
		}
		this.table.addRow(Row);
	}
}

async function presentAlert(Style) {
	const Art = new Alert();
	Art.title = Style.title;
	Art.message = Style.message;
	let TextField = 0;
	let Sorted = Object.keys(Style).sort((a, b) => {
		const NumA = parseInt(a.slice(3), 10);
		const NumB = parseInt(b.slice(3), 10);
		return NumA - NumB;
	});
	Style = Object.fromEntries(Sorted.map(key => [key, Style[key]]));
	for (let [item, value] of Object.entries(Style)) {
		switch (item.slice(0, 3)) { //extract identifier
			case "act": Art.addAction(value); break;
			case "can": Art.addCancelAction(value); break;
			case "des": Art.addDestructiveAction(value); break;
			case "txt":
				switch (value[2]) {
					case "secure": Art.addSecureTextField(value[0], value[1]); break;
					case "number": Art.addTextField(value[0], value[1]).setNumberPadKeyboard(); break;
					case "default": Art.addTextField(value[0], value[1]); break;
				}
				TextField++; break;
		}
	}
	const ActionIndex = Style.type === "alert"
		? await Art.presentAlert()
		: await Art.presentSheet();
	let TextList = [];
	for (let i=0; i<TextField; i++) TextList.push(Art.textFieldValue(i));
	return {index: ActionIndex, text: TextList};
}

function sum(list) {
	let total = 0;
	for (let i=0; i<list.length; i++) {
		total += list[i].type * list[i].amount * (REQUIRED[i].unit == "pieces" ? 1 : 50);
	}
	return total;
}

function addComma(value) {
	return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function checkCondition(i, mode, amount) {
	if (mode !== "deficit") return true;
	if (amount <= REQUIRED[i].required) return true;
	return false;
}

class Table {
	constructor() {
		this.table = new UITable();
		this.table.showSeparators = true;
		this.table.present(false);
		this.difference = [{ "type": 5000, "amount": 0 }, { "type": 1000, "amount": 0 }, { "type": 500, "amount": 0 }, { "type": 100, "amount": 0 }, { "type": 50, "amount": 0 }, { "type": 10, "amount": 0 }, { "type": 5, "amount": 0 }, { "type": 1, "amount": 0 }];
		this.mode = 0;
	}

	refresh() {
		this.table.removeAllRows();
		const darkFont_Active = Color.dynamic(new Color("#7F7F7F"), new Color("#8E8E8E"));
		const darkFont_Inactive = Color.dynamic(new Color("#DDDDDD"), new Color("#303030"));
		const green = Color.dynamic(new Color("#34C759"), new Color("#4AFF3D"));
		const backColor = Color.dynamic(new Color("#CCCCCC"), new Color("#333333"));
		let modeTitle = [
			{ title: "deficit", button: "💸不足■/💰残高□" },
			{ title: "balance", button: "💸不足□/💰残高■" }];
		new Layout(this.table, {
			body: { height: 100, background: backColor },
			txt1: {
				text: ["💰Exchange Calculator", ""],
				font: [new Font("Arial-BoldMT", 30), new Font("Arial-BoldMT", 16)]
			}
		}).ApplyStyles();
		new Layout(this.table, {
			body: { height: 80, background: backColor },
			txt1: {
				text: ["", ""],
				widthWeight: 10
			},
			img2: {
				image: SFSymbol.named("sum").image,
				align: "center",
				widthWeight: 10,
			},
			txt3: {
				text: [`¥ ${addComma(sum(this.difference))}`, ""],
				font: [new Font("Arial-BoldMT", 30), new Font("Arial-BoldMT", 16)],
				color: [green, green],
				align: "right",
				widthWeight: 80
			}
		}).ApplyStyles();
		const titleAndMode = new Layout(this.table);
		titleAndMode.style = {
			body: { height: 50 },
			txt1: {
				text: ["Type", ""],
				font: [new Font("Arial-BoldMT", 20), new Font("Arial-BoldMT", 20)],
				align: "center",
				widthWeight: 28,
			},
			txt2: {
				text: ["Required", ""],
				font: [new Font("Arial-BoldMT", 20), new Font("Arial-BoldMT", 20)],
				align: "center",
				widthWeight: 28,
			},
			btn3: {
				title: modeTitle[this.mode].button,
				widthWeight: 44,
				align: "right",
				id: "changeMode"
			}
		};
		if (this.mode == 1) titleAndMode.style.txt2.color = [darkFont_Inactive, darkFont_Inactive];
		titleAndMode.event = {
			changeMode: () => {
				this.mode = (this.mode + 1) % 2;
				this.refresh()
			}
		};
		titleAndMode.ApplyStyles();
		for (let i = 0; i < this.difference.length; i++) {
			const unit = REQUIRED[i].unit == "pieces" ? "枚" : "本";
			const subtotal = this.difference[i].amount * this.difference[i].type * (REQUIRED[i].unit == "pieces" ? 1 : 50);
			const row = new Layout(this.table);
			row.style = {
				"body": {
					height: 60,
					onSelect: {
						select: true,
						dismiss: false,
						id: "selectRow"
					}
				},
				img1: {
					image: SFSymbol.named("yensign").image,
					widthWeight: 5,
				},
				txt2: {
					text: [`${addComma(this.difference[i].type)}`, ""],
					font: [new Font("Arial-BoldMT", 22), new Font("Arial-BoldMT", 22)],
					align: "right",
					widthWeight: 17,
				},
				txt3: {
					text: [`${addComma(REQUIRED[i].required)}${unit}`, ""],
					font: [new Font("Arial-MT", 22), new Font("Arial-MT", 22)],
					color: [this.mode == 0 ? darkFont_Active : darkFont_Inactive, this.mode == 0 ? darkFont_Active : darkFont_Inactive],
					align: "right",
					widthWeight: 28,
				},
				txt4: {
					text: [" ".repeat(10) + `${addComma(this.difference[i].amount)}${unit}`, " ".repeat(20) + `= ¥${addComma(subtotal)}`],
					font: [new Font("Arial-MT", 23), new Font("Arial-MT", this.difference[i].amount ? 18 : 0)],
					color: [null, green],
					align: "left",
					widthWeight: 54,
				}
			};
			row.event = {
				selectRow: async () => {
					const input = await presentAlert({
						type: "alert",
						title: `Enter the ${modeTitle[this.mode].title} for ¥${this.difference[i].type}`,
						message: `The necessary amount is ${REQUIRED[i].required}${unit}.`,
						act1: "OK",
						can2: "Cancel",
						txt3: ["Enter...", String(this.difference[i].amount == 0 ? "" : this.difference[i].amount), "number"]
					});
					if (input.index === -1) return; // Canceled
					if (!input.text[0]) return; // Empty input
					if (!checkCondition(i, modeTitle[this.mode].title, input.text[0])) {
						const doubleCheck = await presentAlert({
							type: "alert",
							title: `It exceeds the necessary amount`,
							message: `You entered ${input.text[0]}${unit}, but the necessary amount is ${REQUIRED[i].required}${unit}.`,
							des1: "OK",
							can2: "Cancel"
						});
						if (doubleCheck.index === -1) return; // Canceled
					}
					this.difference[i].amount = parseInt(input.text[0]);
					this.refresh();
				}
			};
			row.ApplyStyles();
		}
		this.table.reload();
	}
}

function main() {
	const table = new Table();
	table.refresh();
}

main();

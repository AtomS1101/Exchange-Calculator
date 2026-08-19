const REQUIRED = [
	{ "type": 10000, "required": 0,  "unit": "pieces" },
	{ "type": 5000,  "required": 10, "unit": "pieces" },
	{ "type": 1000,  "required": 20, "unit": "pieces" },
	{ "type": 500,   "required": 1,  "unit": "sticks" },
	{ "type": 100,   "required": 2,  "unit": "sticks" },
	{ "type": 50,    "required": 1,  "unit": "sticks" },
	{ "type": 10,    "required": 2,  "unit": "sticks" },
	{ "type": 5,     "required": 1,  "unit": "sticks" },
	{ "type": 1,     "required": 1,  "unit": "sticks" }
];

const jsonFormat = [
	{ "type": 10000, "piece": 0 },
	{ "type": 5000,  "piece": 0 },
	{ "type": 1000,  "piece": 0 },
	{ "type": 500,   "piece": 0, "stick": 0 },
	{ "type": 100,   "piece": 0, "stick": 0 },
	{ "type": 50,    "piece": 0, "stick": 0 },
	{ "type": 10,    "piece": 0, "stick": 0 },
	{ "type": 5,     "piece": 0, "stick": 0 },
	{ "type": 1,     "piece": 0, "stick": 0 }
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

class SmartFile {
	constructor(filePath){
		const _FM = FileManager.local();
		this.fm = _FM.isFileStoredIniCloud(module.filename) ? FileManager.iCloud() : _FM;
		this.libraryPath = this.fm.joinPath(this.fm.libraryDirectory(), filePath);
		this.extension = filePath.slice(filePath.lastIndexOf(".") + 1).toLowerCase();
	}
	create(content){
		if (!this.fm.fileExists(this.libraryPath)) {
			this.fm.writeString(this.libraryPath, this.extension === "json"
				? JSON.stringify(content, null, "\t") : String(content)
			);
		}
	}
	get content(){
		if (!this.fm.fileExists(this.libraryPath)) return undefined;
		const Content = this.fm.readString(this.libraryPath);
		return this.extension === "json"
			? JSON.parse(Content) : Content;
	}
	set content(newValue){
		this.fm.writeString(this.libraryPath, this.extension === "json"
			? JSON.stringify(newValue, null, "\t") : String(newValue)
		);
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

function addComma(value) {
	return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function sum(list) {
	let total = 0;
	for (let i=0; i<list.length; i++) {
		total += REQUIRED[i].unit === "pieces"
			? list[i].piece * list[i].type
			: list[i].piece * list[i].type + list[i].stick * list[i].type * 50;
	}
	return total;
}

function getRequired(i) {
	return REQUIRED[i].required * REQUIRED[i].type * (REQUIRED[i].unit === "pieces" ? 1 : 50);
}

function getSubtotal(i, amount) {
	return REQUIRED[i].unit === "pieces"
		? amount[0] * REQUIRED[i].type
		: amount[1] * REQUIRED[i].type + amount[0] * REQUIRED[i].type * 50; // order is stick, piece
}

function checkCondition(i, mode, amount) {
	if (mode !== "deficit") return true;
	if (getSubtotal(i, amount) <= getRequired(i)) return true;
	return false;
}

class Table {
	constructor(file) {
		this.table = new UITable();
		this.table.showSeparators = true;
		this.table.present(false);
		this.mode = 0;
		this.file = file;
		this.content = file.content;
	}

	refresh(file) {
		this.table.removeAllRows();
		const darkFont_Active = Color.dynamic(new Color("#7F7F7F"), new Color("#8E8E8E"));
		const darkFont_Inactive = Color.dynamic(new Color("#DDDDDD"), new Color("#303030"));
		const green = Color.dynamic(new Color("#34C759"), new Color("#4AFF3D"));
		const backColor = Color.dynamic(new Color("#CCCCCC"), new Color("#333333"));
		let modeTitle = [
			{ title: "deficit", button: "💸不足■/💰残高□" },
			{ title: "balance", button: "💸不足□/💰残高■" }];
		new Layout(this.table, {
			body: { height: 80, background: backColor },
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
				widthWeight: 12,
			},
			txt3: {
				text: [`¥ ${addComma(sum(this.content))}`, ""],
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
		for (let i=0; i<this.content.length; i++) {
			let subtotal, showCount, unit;
			if (REQUIRED[i].unit === "pieces") {
				subtotal = this.content[i].piece * REQUIRED[i].type;
				showCount = `${addComma(this.content[i].piece)}枚`;
				unit = "枚";
			} else {
				subtotal = this.content[i].piece * REQUIRED[i].type + this.content[i].stick * REQUIRED[i].type * 50; // can't use getSubtotal() since order doesn't match
				showCount = `${addComma(this.content[i].stick)}本 + ${addComma(this.content[i].piece)}枚`;
				unit = "本";
			}
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
					txt1: {
						text: [" ", "¥"],
						font: [new Font("Arial-BoldMT", 5), new Font("Arial-BoldMT", 16)],
						align: "right",
						widthWeight: 5
					},
					txt2: {
						text: [`${addComma(this.content[i].type)}`, ""],
						font: [new Font("Arial-BoldMT", 22), new Font("Arial-BoldMT", 22)],
						align: "right",
						widthWeight: 22,
					},
					txt3: {
						text: [`${addComma(REQUIRED[i].required)}${unit}`, ""],
						font: [new Font("Arial-MT", 22), new Font("Arial-MT", 22)],
						color: [this.mode == 0 ? darkFont_Active : darkFont_Inactive, this.mode == 0 ? darkFont_Active : darkFont_Inactive],
						align: "right",
						widthWeight: 23,
					},
					txt4: {
						text: [" ".repeat(10) + showCount, " ".repeat(20) + `= ¥${addComma(subtotal)}`],
						font: [new Font("Arial-MT", 23), new Font("Arial-MT", (this.content[i].piece || this.content[i].stick) ? 18 : 0)],
						color: [null, green],
						align: "left",
						widthWeight: 54,
					}
				};
				row.event = {
					selectRow: async () => {
						let alertStyle = {
							type: "alert",
							title: `Enter the ${modeTitle[this.mode].title} for ¥${this.content[i].type}`,
							message: `The necessary ${REQUIRED[i].unit} is ${REQUIRED[i].required}${unit}.`,
							act1: "OK",
							can2: "Cancel"
						};
						if (REQUIRED[i].unit === "pieces") {
							alertStyle.txt3 = ["枚数...", String(this.content[i].piece == 0 ? "" : this.content[i].piece), "number"];
						} else {
							alertStyle.txt3 = ["本数...", String(this.content[i].stick == 0 ? "" : this.content[i].stick), "number"];
							alertStyle.txt4 = ["枚数...", String(this.content[i].piece == 0 ? "" : this.content[i].piece), "number"];
						}
						const input = await presentAlert(alertStyle);
						if (input.index === -1) return; // Canceled
						if (!input.text[0] && !input.text[1]) return; // Empty input
						if (!checkCondition(i, modeTitle[this.mode].title, input.text)) {
							const doubleCheck = await presentAlert({
								type: "alert",
								title: `It exceeds the necessary piece`,
								message: `You entered ¥${addComma(getSubtotal(i, input.text))}, but the necessary is ¥${addComma(getRequired(i))}.`,
								des1: "OK",
								can2: "Cancel"
							});
							if (doubleCheck.index === -1) return; // Canceled
						}
						if (REQUIRED[i].unit === "pieces") {
							this.content[i].piece = parseInt(input.text[0]);
						} else {
							this.content[i].stick = parseInt(input.text[0] ? input.text[0] : 0) + parseInt(input.text[1] / 50); // avoid being NaN
							this.content[i].piece = parseInt(input.text[1] % 50);
						}
						this.file.content = this.content;
						this.refresh();
					}
				};
			row.ApplyStyles();
		}
		const resetBtnRow = new Layout(this.table);
		resetBtnRow.style = {
			body: { height: 100 },
			btn1: {
				title: " ".repeat(20) + "Reset Sheet",
				align: "right",
				widthWeight: 100,
				id: "reset"
			}
		};
		resetBtnRow.event = {
			reset: async () => {
				const confirm = await presentAlert({
					type: "sheet",
					title: "Reset",
					message: "Are you sure you want to reset?",
					des1: "Reset",
					can2: "Cancel"
				});
				if (confirm.index === -1) return;
				this.content = jsonFormat;
				this.file.content = this.content;
				this.refresh();
			}
		};
		resetBtnRow.ApplyStyles();
		this.table.reload();
	}
}

function main() {
	const file = new SmartFile("ExchangeRecord.json");
	file.create(jsonFormat);
	const table = new Table(file);
	table.refresh();
}

main();

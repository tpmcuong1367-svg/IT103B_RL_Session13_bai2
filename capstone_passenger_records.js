const CCCD_PATTERN = /^\d{12}$/;
const PASSPORT_PATTERN = /^[A-Z]\d{7,8}$/;
const PNR_PATTERN = /^[A-Z0-9]{6}$/;
const NAME_PATTERN = /^[\p{L}][\p{L}\s'.-]{1,49}$/u;
const SEAT_LETTERS = ["A", "B", "C", "D", "E", "F"];
const BOARDING_PASS_WIDTH = 56;

const flights = [
    { flightNumber: "VN210", route: "SGN - HAN", departure: "08:30", gate: "A05", totalRows: 3 },
    { flightNumber: "VJ132", route: "SGN - DAD", departure: "10:15", gate: "B12", totalRows: 30 },
    { flightNumber: "QH502", route: "SGN - PQC", departure: "14:00", gate: "C03", totalRows: 25 }
];

const passengers = [
    { pnrCode: "ABC123", passengerName: "Nguyen Van An", idNumber: "079201001234", flightNumber: "VN210", seatNumber: "", isCheckedIn: false },
    { pnrCode: "XYZ789", passengerName: "Tran Thi Binh", idNumber: "B1234567", flightNumber: "VN210", seatNumber: "", isCheckedIn: false },
    { pnrCode: "LMN456", passengerName: "Le Hoang Cuong", idNumber: "079301005678", flightNumber: "VJ132", seatNumber: "", isCheckedIn: false }
];

function normalizeText(input) {
    return String(input).trim().toUpperCase();
}

function removeDiacritics(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

function isValidCccd(idNumber) {
    return CCCD_PATTERN.test(idNumber);
}

function isValidPassport(idNumber) {
    return PASSPORT_PATTERN.test(idNumber);
}

function getIdType(idNumber) {
    if (isValidCccd(idNumber)) {
        return "CCCD";
    }
    if (isValidPassport(idNumber)) {
        return "PASSPORT";
    }
    return null;
}

function isValidName(name) {
    return NAME_PATTERN.test(name.trim());
}

function isValidPnr(pnr) {
    return PNR_PATTERN.test(pnr);
}

function findFlight(flightNumber) {
    return flights.find(function (flight) {
        return flight.flightNumber === flightNumber;
    }) || null;
}

function findPassengerByPnr(pnr) {
    return passengers.find(function (passenger) {
        return passenger.pnrCode === pnr;
    }) || null;
}

function findPassengersByKeyword(keyword) {
    const text = keyword.trim().toLowerCase();
    return passengers.filter(function (passenger) {
        return passenger.passengerName.toLowerCase().includes(text) ||
            passenger.idNumber.toLowerCase() === text;
    });
}

function isDuplicateIdOnFlight(idNumber, flightNumber) {
    return passengers.some(function (passenger) {
        return passenger.idNumber === idNumber && passenger.flightNumber === flightNumber;
    });
}

function isSeatTaken(flightNumber, seatNumber) {
    return passengers.some(function (passenger) {
        return passenger.flightNumber === flightNumber &&
            passenger.seatNumber === seatNumber &&
            passenger.isCheckedIn;
    });
}

function generatePnr() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pnr;
    do {
        pnr = "";
        for (let i = 0; i < 6; i++) {
            pnr += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (findPassengerByPnr(pnr) !== null);
    return pnr;
}

function assignSeat(flightNumber) {
    const flight = findFlight(flightNumber);
    if (flight === null) {
        return null;
    }
    for (let row = 1; row <= flight.totalRows; row++) {
        for (let i = 0; i < SEAT_LETTERS.length; i++) {
            const seat = row + SEAT_LETTERS[i];
            if (!isSeatTaken(flightNumber, seat)) {
                return seat;
            }
        }
    }
    return null;
}

function verifyIdentity(passenger, idInput, flightInput) {
    const idNumber = normalizeText(idInput);
    const flightNumber = normalizeText(flightInput);
    if (getIdType(idNumber) === null) {
        return { valid: false, message: "Giay to khong hop le (CCCD 12 so hoac Ho chieu 1 chu + 7-8 so)." };
    }
    if (passenger.idNumber !== idNumber) {
        return { valid: false, message: "So giay to khong khop voi ho so dat cho." };
    }
    if (passenger.flightNumber !== flightNumber) {
        return { valid: false, message: "Ma chuyen bay khong khop voi ho so dat cho." };
    }
    return { valid: true, message: "Xac thuc thanh cong (" + getIdType(idNumber) + ")." };
}

function maskIdNumber(idNumber) {
    return idNumber.slice(0, 3) + "*".repeat(idNumber.length - 6) + idNumber.slice(-3);
}

function generateBarcode(text) {
    let bars = "";
    for (let i = 0; i < text.length; i++) {
        const bits = text.charCodeAt(i).toString(2).padStart(8, "0").slice(-6);
        for (let j = 0; j < bits.length; j++) {
            bars += bits[j] === "1" ? "|" : " ";
        }
        bars += "|";
    }
    return bars;
}

function frameLine(text) {
    const innerWidth = BOARDING_PASS_WIDTH - 4;
    const content = text.length > innerWidth ? text.slice(0, innerWidth) : text;
    return "= " + content.padEnd(innerWidth, " ") + " =";
}

function centerText(text) {
    const innerWidth = BOARDING_PASS_WIDTH - 4;
    const left = Math.max(0, Math.floor((innerWidth - text.length) / 2));
    return " ".repeat(left) + text;
}

function displayBoardingPass(passenger) {
    const flight = findFlight(passenger.flightNumber);
    const border = "=".repeat(BOARDING_PASS_WIDTH);
    const barcode = generateBarcode(passenger.pnrCode + passenger.seatNumber);
    const lines = [
        border,
        frameLine(centerText("BOARDING PASS")),
        border,
        frameLine("PASSENGER : " + removeDiacritics(passenger.passengerName).toUpperCase()),
        frameLine("PNR       : " + passenger.pnrCode),
        frameLine("FLIGHT    : " + passenger.flightNumber + "  (" + flight.route + ")"),
        frameLine("DEPARTURE : " + flight.departure + "      GATE: " + flight.gate),
        frameLine("SEAT      : " + passenger.seatNumber),
        frameLine("ID        : " + maskIdNumber(passenger.idNumber)),
        border,
        frameLine(centerText(barcode.slice(0, BOARDING_PASS_WIDTH - 4))),
        frameLine(centerText(passenger.pnrCode + " " + passenger.flightNumber + " " + passenger.seatNumber)),
        border
    ];
    console.log(lines.join("\n"));
}

function listPassengers() {
    if (passengers.length === 0) {
        console.log("Chua co ho so hanh khach nao.");
        return;
    }
    console.table(passengers.map(function (passenger) {
        return {
            PNR: passenger.pnrCode,
            "Hanh khach": passenger.passengerName,
            "Giay to": maskIdNumber(passenger.idNumber),
            "Chuyen bay": passenger.flightNumber,
            Ghe: passenger.seatNumber || "-",
            "Da check-in": passenger.isCheckedIn ? "YES" : "NO"
        };
    }));
}

function promptRequired(message) {
    const input = prompt(message);
    if (input === null) {
        return null;
    }
    const value = input.trim();
    if (value === "") {
        console.log("Du lieu khong duoc de trong.");
        return null;
    }
    return value;
}

function promptExistingPassenger() {
    const input = promptRequired("Nhập mã PNR (6 ký tự):");
    if (input === null) {
        return null;
    }
    const pnr = normalizeText(input);
    if (!isValidPnr(pnr)) {
        console.log("Ma PNR khong hop le. PNR gom dung 6 ky tu chu hoac so.");
        return null;
    }
    const passenger = findPassengerByPnr(pnr);
    if (passenger === null) {
        console.log("Khong tim thay ho so voi ma PNR: " + pnr);
        return null;
    }
    return passenger;
}

function addPassenger() {
    const name = promptRequired("Nhập họ tên hành khách:");
    if (name === null) {
        return;
    }
    if (!isValidName(name)) {
        console.log("Ho ten khong hop le (chi gom chu cai, 2-50 ky tu).");
        return;
    }

    const idInput = promptRequired("Nhập số CCCD (12 số) hoặc Hộ chiếu (1 chữ + 7-8 số):");
    if (idInput === null) {
        return;
    }
    const idNumber = normalizeText(idInput);
    if (getIdType(idNumber) === null) {
        console.log("Giay to khong hop le (CCCD 12 so hoac Ho chieu 1 chu + 7-8 so).");
        return;
    }

    const flightInput = promptRequired("Nhập mã chuyến bay (" + flights.map(function (f) { return f.flightNumber; }).join(", ") + "):");
    if (flightInput === null) {
        return;
    }
    const flightNumber = normalizeText(flightInput);
    if (findFlight(flightNumber) === null) {
        console.log("Chuyen bay khong ton tai: " + flightNumber);
        return;
    }
    if (isDuplicateIdOnFlight(idNumber, flightNumber)) {
        console.log("Giay to nay da co ho so tren chuyen bay " + flightNumber + ".");
        return;
    }

    const passenger = {
        pnrCode: generatePnr(),
        passengerName: name.replace(/\s+/g, " "),
        idNumber: idNumber,
        flightNumber: flightNumber,
        seatNumber: "",
        isCheckedIn: false
    };
    passengers.push(passenger);
    console.log("Da tiep nhan ho so moi. Ma PNR: " + passenger.pnrCode);
}

function verifyPassenger() {
    const passenger = promptExistingPassenger();
    if (passenger === null) {
        return;
    }
    const idInput = promptRequired("Nhập số giấy tờ tùy thân xuất trình:");
    if (idInput === null) {
        return;
    }
    const flightInput = promptRequired("Nhập mã chuyến bay trên thẻ/vé:");
    if (flightInput === null) {
        return;
    }
    const result = verifyIdentity(passenger, idInput, flightInput);
    console.log((result.valid ? "[HOP LE] " : "[TU CHOI] ") + result.message);
    if (result.valid) {
        console.log("Hanh khach: " + passenger.passengerName + " | Giay to: " + maskIdNumber(passenger.idNumber) + " | Chuyen bay: " + passenger.flightNumber);
    }
}

function checkInPassenger() {
    const passenger = promptExistingPassenger();
    if (passenger === null) {
        return;
    }
    if (passenger.isCheckedIn) {
        console.log("Hanh khach da check-in truoc do, ghe " + passenger.seatNumber + ".");
        return;
    }
    const idInput = promptRequired("Nhập số giấy tờ tùy thân xuất trình:");
    if (idInput === null) {
        return;
    }
    const flightInput = promptRequired("Nhập mã chuyến bay trên thẻ/vé:");
    if (flightInput === null) {
        return;
    }
    const result = verifyIdentity(passenger, idInput, flightInput);
    console.log((result.valid ? "[HOP LE] " : "[TU CHOI] ") + result.message);
    if (!result.valid) {
        return;
    }

    const seat = assignSeat(passenger.flightNumber);
    if (seat === null) {
        console.log("Chuyen bay " + passenger.flightNumber + " da het ghe trong.");
        return;
    }
    if (isSeatTaken(passenger.flightNumber, seat)) {
        console.log("Ghe " + seat + " da co nguoi, vui long thu lai.");
        return;
    }
    passenger.seatNumber = seat;
    passenger.isCheckedIn = true;
    console.log("Check-in thanh cong. Ghe duoc cap: " + seat);
    displayBoardingPass(passenger);
}

function reprintBoardingPass() {
    const passenger = promptExistingPassenger();
    if (passenger === null) {
        return;
    }
    if (!passenger.isCheckedIn) {
        console.log("Hanh khach chua check-in, khong the in the len may bay.");
        return;
    }
    displayBoardingPass(passenger);
}

function searchPassenger() {
    const keyword = promptRequired("Nhập mã PNR, số giấy tờ hoặc tên hành khách:");
    if (keyword === null) {
        return;
    }
    const pnr = normalizeText(keyword);
    const byPnr = isValidPnr(pnr) ? findPassengerByPnr(pnr) : null;
    const matches = byPnr !== null ? [byPnr] : findPassengersByKeyword(keyword);
    if (matches.length === 0) {
        console.log("Khong tim thay ho so phu hop voi: " + keyword);
        return;
    }
    console.table(matches.map(function (passenger) {
        return {
            PNR: passenger.pnrCode,
            "Hanh khach": passenger.passengerName,
            "Giay to": maskIdNumber(passenger.idNumber),
            "Chuyen bay": passenger.flightNumber,
            Ghe: passenger.seatNumber || "-",
            "Da check-in": passenger.isCheckedIn ? "YES" : "NO"
        };
    }));
}

function showMenu() {
    console.log("\n====== HE THONG HO SO HANH KHACH & CHECK-IN ======");
    console.log("1. Danh sach ho so hanh khach");
    console.log("2. Tiep nhan ho so moi");
    console.log("3. Xac thuc giay to tuy than");
    console.log("4. Check-in & cap ghe & in the len may bay");
    console.log("5. In lai the len may bay");
    console.log("6. Tra cuu ho so");
    console.log("0. Thoat");
    console.log("==================================================");
}

function readMenuChoice() {
    const input = prompt(
        "QUẢN LÝ HỒ SƠ HÀNH KHÁCH\n1. Danh sách hồ sơ\n2. Tiếp nhận hồ sơ mới\n3. Xác thực giấy tờ\n4. Check-in & in thẻ lên máy bay\n5. In lại thẻ lên máy bay\n6. Tra cứu hồ sơ\n0. Thoát\n\nNhập lựa chọn (0-6):"
    );
    if (input === null) {
        return 0;
    }
    const text = input.trim();
    return text === "" ? -1 : Number(text);
}

function main() {
    let menuChoice;
    do {
        showMenu();
        menuChoice = readMenuChoice();
        switch (menuChoice) {
            case 1:
                listPassengers();
                break;
            case 2:
                addPassenger();
                break;
            case 3:
                verifyPassenger();
                break;
            case 4:
                checkInPassenger();
                break;
            case 5:
                reprintBoardingPass();
                break;
            case 6:
                searchPassenger();
                break;
            case 0:
                console.log("Ket thuc ca lam viec. Hen gap lai!");
                break;
            default:
                console.log("Lua chon khong hop le. Vui long nhap so tu 0 den 6.");
        }
    } while (menuChoice !== 0);
}

main();

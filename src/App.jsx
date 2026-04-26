import { useState, useEffect, useRef, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

var CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" }
];

var DEFAULT_CATEGORIES = {
  Household: ["Rent","Electricity","Groceries","Water","Gas","Maintenance"],
  Leisure: ["Travel","Food","Snacks","Refreshments","Entertainment"],
  "Personal Care": ["Haircut","Clothes","Skincare","Misc"],
  "Loan Repayment": ["Home Loan","Car Loan","Personal Loan","Education Loan"],
  Savings: ["FD","Stock Market","Chit","Mutual Fund","PPF","NPS"],
  "Flight Ticket": ["Domestic","International"],
  Office: ["Travel","Stationery","Meals","Equipment"],
  Health: ["Hospital","Medicine","Sports","Fitness","Insurance"],
  Subscription: ["OTT","Newspaper","Digital Prints","Software","Gym"],
  Income: ["Salary","Freelance","Business","Investment Returns","Rental","Other"]
};

var ACCOUNT_TYPES = ["Savings", "Credit Card", "Cash", "Wallet"];
var DEFAULT_ACCOUNTS = [
  { id: "acc1", type: "Savings", name: "HDFC Savings" },
  { id: "acc2", type: "Savings", name: "SBI Savings" },
  { id: "acc3", type: "Credit Card", name: "HDFC Diners Club" },
  { id: "acc4", type: "Credit Card", name: "SBI Credit Card" },
  { id: "acc5", type: "Wallet", name: "Swiggy Money" },
  { id: "acc6", type: "Cash", name: "Cash" }
];
var ACCT_COLORS = { "Savings": "#10b981", "Credit Card": "#ef4444", "Cash": "#f59e0b", "Wallet": "#6366f1" };

var COLORS = ["#6366f1","#06b6d4","#f59e0b","#10b981","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#84cc16","#3b82f6","#a855f7"];
var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var TABS = ["Dashboard","Transactions","Upload","Categories","Settings"];

var LOCAL_RULES = [
  { kw: ["SALARY","SALFEBRUARY","SALMARCH","BAINCAP","BAIN CAPABILITY"], cat: "Income", sub: "Salary" },
  { kw: ["RENT","HOUSE RENT"], cat: "Household", sub: "Rent" },
  { kw: ["ELECTRICITY","BESCOM","MSEDCL","TNEB"], cat: "Household", sub: "Electricity" },
  { kw: ["GROCERY","GROCERIES","SUPERMART","HYPERMARKET","AVENUE","AMAZON IN GROCERY","BLINKIT","BIGBASKET"], cat: "Household", sub: "Groceries" },
  { kw: ["WATER"], cat: "Household", sub: "Water" },
  { kw: ["MILK"], cat: "Household", sub: "Groceries" },
  { kw: ["SNACKS","SNACK","PANIPURI","POPCORN","CHAI","TEA","BAKERY","JUICE","ROSEMILK","BHEL","PAAN","KOOZH","DOSA","LEMON SODA","COCONUT","BEEDA"], cat: "Leisure", sub: "Snacks" },
  { kw: ["BREAKFAST","BF","LUNCH","DINNER","FOOD","BIRYANI","CATERER","SWEETS","CHICKS","RESTAURANT","CAFE","KFC","DISTRICT DINING","THEOS","OM SWEETS","MYSURPA"], cat: "Leisure", sub: "Food" },
  { kw: ["COFFEE","BREW","REFRESHMENT"], cat: "Leisure", sub: "Refreshments" },
  { kw: ["METRO","AUTO","CAB","UBER","OLA","RAPIDO","BUS","SETC","NCMC"], cat: "Leisure", sub: "Travel" },
  { kw: ["FLIGHT","GOIBIBO","MAKEMYTRIP","INDIGO","AIRINDIA","SPICEJET","CLEARTRIP"], cat: "Flight Ticket", sub: "Domestic" },
  { kw: ["PETROL","DIESEL","FUEL"], cat: "Office", sub: "Travel" },
  { kw: ["HAIRCUT","SALON","SPA","SOIS BELLE"], cat: "Personal Care", sub: "Haircut" },
  { kw: ["PANT","TROUSER","SAREE","SUIT","CHAPPAL","SOCKS","BLOUSE","LIFESTYLE","3 D CONCEPT","SHIRT"], cat: "Personal Care", sub: "Clothes" },
  { kw: ["MEDICINE","TABLET","PHARMA","CHEMIST","APOLLO","MEDPLUS","HOSPITAL"], cat: "Health", sub: "Medicine" },
  { kw: ["GYM","FITNESS","CULT"], cat: "Health", sub: "Fitness" },
  { kw: ["SPORTS","BADMINTON","SQUASH"], cat: "Health", sub: "Sports" },
  { kw: ["NETFLIX","HOTSTAR","SPOTIFY","BOOKMYSHOW","BOOK MY SHOW","PRIME VIDEO"], cat: "Subscription", sub: "OTT" },
  { kw: ["AIRTEL","RECHARGE"], cat: "Subscription", sub: "Software" },
  { kw: ["MUTUAL FUND","ZERODHA","GROWW"], cat: "Savings", sub: "Mutual Fund" },
  { kw: ["EMI","LOAN REPAY"], cat: "Loan Repayment", sub: "Personal Loan" },
  { kw: ["INSURANCE","MANIPALCIGNA","CIGNA"], cat: "Health", sub: "Insurance" },
  { kw: ["AMAZON","FLIPKART","MEESHO","MYNTRA","AJIO","MAX HYPERMARKET"], cat: "Personal Care", sub: "Clothes" },
  { kw: ["BHIMCASHBACK","CASHBACK"], cat: "Income", sub: "Other" },
  { kw: ["ZEPTO MARKETPLACE","ZEPTO"], cat: "Household", sub: "Groceries" },
  { kw: ["PYU*SWIGGY","CAS*SWIGGY"], cat: "Leisure", sub: "Food" },
  { kw: ["BUNDL TECHNOLOGIES"], cat: "Household", sub: "Groceries" },
  // Indian Bank specific
  { kw: ["SMS_CHGS","SERVICE CHARGES","ACHCR"], cat: "Subscription", sub: "Software" },
  { kw: ["NTPC","ONGC","OIL AND NATURAL GAS","ITC LIMITED","NATCO","SBIMF","MANAPPURAM"], cat: "Savings", sub: "Stock Market" },
  { kw: ["ZERODHA","zerodhabrok"], cat: "Savings", sub: "Stock Market" }
];

// ─── localStorage store with chunked storage to overcome 5MB limit ───────────
var store = {
  get: function(key) {
    // Try chunked first
    var meta = localStorage.getItem(key + "__meta");
    if (meta) {
      try {
        var m = JSON.parse(meta);
        var chunks = [];
        for (var i = 0; i < m.chunks; i++) {
          chunks.push(localStorage.getItem(key + "__chunk__" + i) || "");
        }
        return { value: chunks.join("") };
      } catch(e) {}
    }
    // Fallback to plain
    var v = localStorage.getItem(key);
    return v ? { value: v } : null;
  },
  set: function(key, value) {
    // Remove old chunks if any
    var oldMeta = localStorage.getItem(key + "__meta");
    if (oldMeta) {
      try {
        var om = JSON.parse(oldMeta);
        for (var i = 0; i < om.chunks; i++) localStorage.removeItem(key + "__chunk__" + i);
        localStorage.removeItem(key + "__meta");
      } catch(e) {}
    }
    // Try plain storage first
    try {
      localStorage.setItem(key, value);
      return;
    } catch(e) {}
    // If that fails, chunk it (500KB per chunk)
    var CHUNK = 500000;
    var numChunks = Math.ceil(value.length / CHUNK);
    try {
      for (var j = 0; j < numChunks; j++) {
        localStorage.setItem(key + "__chunk__" + j, value.slice(j * CHUNK, (j + 1) * CHUNK));
      }
      localStorage.setItem(key + "__meta", JSON.stringify({ chunks: numChunks }));
      localStorage.removeItem(key);
    } catch(e) {
      console.warn("Storage full even with chunking:", e);
    }
  },
  del: function(key) {
    var meta = localStorage.getItem(key + "__meta");
    if (meta) {
      try {
        var m = JSON.parse(meta);
        for (var i = 0; i < m.chunks; i++) localStorage.removeItem(key + "__chunk__" + i);
        localStorage.removeItem(key + "__meta");
      } catch(e) {}
    }
    localStorage.removeItem(key);
  }
};

function fmt(val, sym) {
  return sym + Number(val).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function downloadFile(content, filename, mime) {
  try {
    var b64 = btoa(unescape(encodeURIComponent(content)));
    var a = document.createElement("a");
    a.href = "data:" + mime + ";base64," + b64;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch(e) { alert("Export failed: " + e.message); }
}

function extractJSON(raw) {
  var si = raw.indexOf("["), ei = raw.lastIndexOf("]");
  if (si === -1 || ei === -1 || ei <= si) return null;
  var s = raw.slice(si, ei + 1);
  try { return JSON.parse(s); }
  catch(e) { try { return JSON.parse(s.replace(/,\s*([}\]])/g, "$1")); } catch(e2) { return null; } }
}

function parseHDFCBank(text) {
  var lines = text.split("\n");
  var txns = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var cols = line.split(",").map(function(c) { return c.trim(); });
    if (cols.length < 5) continue;
    var dateStr = cols[0].trim();
    if (!/^\d{2}\/\d{2}\/\d{2}$/.test(dateStr)) continue;
    var narration = cols[1] ? cols[1].trim() : "";
    var debit = parseFloat(cols[3]) || 0;
    var credit = parseFloat(cols[4]) || 0;
    if (debit === 0 && credit === 0) continue;
    var parts = dateStr.split("/");
    var date = "20" + parts[2] + "-" + parts[1] + "-" + parts[0];
    var amount = debit > 0 ? debit : credit;
    var type = debit > 0 ? "expense" : "income";
    // Extract richer description: for UPI txns capture "UPI ID | remarks"
    // Narration format: UPI-MERCHANT NAME-upiid@bank-BANKCODE-refnum-REMARKS
    var desc;
    var upiMatch = narration.match(/^UPI-[^-]+-([^-]+@[^-]+)-[^-]+-[^-]+-(.+)$/i);
    if (upiMatch) {
      desc = upiMatch[1].trim() + " | " + upiMatch[2].trim();
    } else {
      desc = narration.replace(/^(UPI-|IMPS-|NEFT DR-|NEFT CR-|ACH C-|IB BILLPAY DR-|ATW-)/, "").split("-").pop().trim() || narration.substring(0, 60);
    }
    txns.push({ date: date, description: desc, amount: amount, type: type });
  }
  return txns;
}

function parseHDFCCreditCard(text) {
  var lines = text.split("\n");
  var txns = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var cols = line.split("~|~").map(function(c) { return c.trim(); });
    if (cols.length < 6) continue;
    var txnType = cols[0];
    if (txnType !== "Domestic" && txnType !== "International") continue;

    // Support both formats:
    // Old (6-col): Domestic~|~DATE~|~DESC~|~AMT~|~Cr/Dr~|~REWARDS
    // New (7-col): Domestic~|~NAME~|~DATE~|~DESC~|~AMT~|~Cr/Dr~|~REWARDS
    var dateCol, descCol, amtCol, crCol;
    var col2date = cols[2] ? cols[2].split(" ")[0] : "";
    var col1date = cols[1] ? cols[1].split(" ")[0] : "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(col1date)) {
      // Old format: date at col 1
      dateCol = 1; descCol = 2; amtCol = 3; crCol = 4;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(col2date)) {
      // New format: date at col 2
      dateCol = 2; descCol = 3; amtCol = 4; crCol = 5;
    } else {
      continue;
    }

    var dateStr = cols[dateCol].split(" ")[0];
    var description = cols[descCol] ? cols[descCol].trim() : "";
    // Remove commas from amount (e.g. "5,007.00" -> "5007.00")
    var amtStr = cols[amtCol] ? cols[amtCol].replace(/,/g, "").replace(/\s/g, "").trim() : "0";
    var amount = parseFloat(amtStr) || 0;
    var creditFlag = cols[crCol] ? cols[crCol].trim() : "";
    if (amount === 0) continue;
    var dp = dateStr.split("/");
    var date = dp[2] + "-" + dp[1] + "-" + dp[0];
    var type = creditFlag === "Cr" ? "income" : "expense";
    txns.push({ date: date, description: description, amount: amount, type: type });
  }
  return txns;
}

function localCategorize(txns) {
  return txns.map(function(t) {
    var desc = (t.description || "").toUpperCase();
    for (var i = 0; i < LOCAL_RULES.length; i++) {
      var rule = LOCAL_RULES[i];
      for (var j = 0; j < rule.kw.length; j++) {
        if (desc.indexOf(rule.kw[j]) > -1) {
          if (t.type === "income" && rule.cat !== "Income") continue;
          return Object.assign({}, t, { category: rule.cat, subcategory: rule.sub, autocat: "high" });
        }
      }
    }
    return Object.assign({}, t, { category: "", subcategory: "", autocat: "low" });
  });
}

function parseIndianBank(text) {
  // Indian Bank fixed-width statement parser
  // Format: "   20 Feb 2026      DESCRIPTION      INR X,XXX.XX      -      INR X,XXX.XX"
  // Transactions span multiple lines; date only appears on first line of each entry
  var lines = text.split("\n");
  var txns = [];
  var MONTHS = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };

  var i = 0;
  while (i < lines.length) {
    var line = lines[i];
    // Look for a date at the start (after whitespace): "   20 Feb 2026"
    var dateMatch = line.match(/^\s{5,}(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+(.+)/);
    if (!dateMatch) { i++; continue; }

    var day = dateMatch[1].padStart(2, "0");
    var mon = String(MONTHS[dateMatch[2]]).padStart(2, "0");
    var yr = dateMatch[3];
    var date = yr + "-" + mon + "-" + day;

    // Collect all continuation lines until next blank-line group or next date
    var allText = dateMatch[4];
    var j = i + 1;
    while (j < lines.length) {
      var next = lines[j];
      // Stop if we hit a new date line
      if (/^\s{5,}\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/.test(next)) break;
      // Stop after 6 continuation lines to avoid runaway
      if (j - i > 6) break;
      allText += " " + next;
      j++;
    }
    i = j;

    // Extract debit and credit amounts: "INR X,XXX.XX"
    var amounts = [];
    var amtRe = /INR\s+([\d,]+\.?\d*)/g;
    var m;
    while ((m = amtRe.exec(allText)) !== null) {
      amounts.push(parseFloat(m[1].replace(/,/g, "")));
    }
    if (amounts.length < 2) continue;

    // Determine which is debit/credit by checking for "-" placeholders
    // In the statement: debit column shows INR amount, credit shows "-", and vice versa
    // The pattern is: DESCRIPTION   DEBIT   CREDIT   BALANCE
    // We detect by position of "-" between the INR values
    var debit = 0, credit = 0;
    // Check if there's a "-" between first and second INR amount (meaning debit=amounts[0], credit=0)
    var firstAmtIdx = allText.indexOf("INR");
    var afterFirst = allText.indexOf("INR", firstAmtIdx + 3);
    var between = allText.slice(firstAmtIdx, afterFirst);
    if (/\s+-\s+/.test(between) || between.indexOf(" - ") > -1) {
      // debit is amounts[0], credit is 0 (the "-" is the credit column)
      debit = amounts[0];
    } else {
      // credit is amounts[0], debit is 0
      credit = amounts[0];
    }

    if (debit === 0 && credit === 0) continue;

    // Extract description: the text before the first INR, after stripping date portion
    var descRaw = allText.slice(0, allText.indexOf("INR")).trim();
    // Clean up: remove BRANCH info and extra whitespace
    descRaw = descRaw.replace(/\/BRANCH\s*:.*$/i, "").replace(/\s{2,}/g, " ").trim();
    // For UPI transactions extract UPI ID if present
    var upiId = descRaw.match(/([a-zA-Z0-9._]+@[a-zA-Z]+)/);
    var remarks = descRaw.split("/").pop().trim();
    var desc = upiId ? upiId[1] + " | " + remarks : descRaw.substring(0, 80);
    if (!desc || desc.length < 2) continue;

    txns.push({ date: date, description: desc, amount: debit > 0 ? debit : credit, type: debit > 0 ? "expense" : "income" });
  }
  return txns;
}

function parseAxisBank(text) {
  // Axis Bank CSV: Tran Date,CHQNO,PARTICULARS,DR,CR,BAL,SOL
  // Date format: DD-MM-YYYY
  var lines = text.split("\n");
  var txns = [];
  var headerIdx = -1;

  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf("Tran Date") > -1 && lines[i].indexOf("PARTICULARS") > -1) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return [];

  for (var r = headerIdx + 1; r < lines.length; r++) {
    var line = lines[r].trim();
    if (!line) continue;

    // Split by comma but respect quoted fields
    var cols = [];
    var cur = "", inQ = false;
    for (var c = 0; c < line.length; c++) {
      if (line[c] === '"') { inQ = !inQ; }
      else if (line[c] === ',' && !inQ) { cols.push(cur.trim()); cur = ""; }
      else { cur += line[c]; }
    }
    cols.push(cur.trim());

    if (cols.length < 5) continue;

    // Date: DD-MM-YYYY
    var dateStr = cols[0].trim();
    var dm = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!dm) continue;
    var date = dm[3] + "-" + dm[2] + "-" + dm[1];

    var particulars = cols[2] ? cols[2].trim() : "";
    if (!particulars) continue;

    var drStr = cols[3] ? cols[3].replace(/,/g, "").trim() : "";
    var crStr = cols[4] ? cols[4].replace(/,/g, "").trim() : "";
    var debit = parseFloat(drStr) || 0;
    var credit = parseFloat(crStr) || 0;
    if (debit === 0 && credit === 0) continue;

    // Extract description from PARTICULARS
    // UPI format: UPI/P2M/refnum/MERCHANT NAME/remarks/BANK
    // NEFT format: NEFT/refnum/NAME/BANK/NAME
    var desc = particulars;
    var upiMatch = particulars.match(/^UPI\/P2[MA]\/\d+\/([^\/]+)\/([^\/]*)\//i);
    if (upiMatch) {
      var merchant = upiMatch[1].trim();
      var remarks = upiMatch[2].trim();
      desc = remarks && remarks.length > 1 && remarks !== "NO REM" && remarks !== "Paid v" && remarks !== "UPI"
        ? merchant + " | " + remarks
        : merchant;
    } else {
      var neftMatch = particulars.match(/^NEFT\/[^\/]+\/([^\/]+)\//i);
      if (neftMatch) desc = neftMatch[1].trim();
    }
    desc = desc.substring(0, 80);

    txns.push({ date: date, description: desc, amount: debit > 0 ? debit : credit, type: debit > 0 ? "expense" : "income" });
  }
  return txns;
}

function parseHDFCBankText(text) {
  // HDFC Bank fixed-width text statement parser
  // Balance always at pos ~126, Withdrawal at pos ~85-107, Deposit at pos ~100-125
  var lines = text.split("\n");
  var txns = [];
  var currentDate = null;
  var currentNarration = "";
  var currentWithdrawal = 0;
  var currentDeposit = 0;
  var inTxns = false;

  function parseAmt(s) {
    if (!s || !s.trim()) return 0;
    return parseFloat(s.replace(/,/g, "").trim()) || 0;
  }

  function pushTxn() {
    if (!currentDate || (!currentWithdrawal && !currentDeposit)) return;
    var parts = currentDate.split("/");
    var date = "20" + parts[2] + "-" + parts[1] + "-" + parts[0];
    var narration = currentNarration.trim()
      .replace(/\*\*Continue\*\*/gi, "")
      .replace(/\s{2,}/g, " ").trim();

    var desc;
    var upiMatch = narration.match(/^UPI-[^-]+-([^\s-]+@[^\s-]+)-[^-]+-[^-]+-(.+)$/i);
    if (upiMatch) {
      var upiId = upiMatch[1].replace(/\s/g, "").trim();
      var remarks = upiMatch[2].replace(/\s+/g, " ").trim();
      desc = upiId + " | " + remarks;
    } else {
      desc = narration
        .replace(/^(UPI-|IMPS-|NEFT DR-|NEFT CR-|ACH C-|IB BILLPAY DR-|ATW-|O-MF-)/, "")
        .split("-").pop().replace(/\s+/g, " ").trim() || narration.substring(0, 60);
    }
    desc = desc.substring(0, 80);

    if (currentWithdrawal > 0)
      txns.push({ date: date, description: desc, amount: currentWithdrawal, type: "expense" });
    if (currentDeposit > 0)
      txns.push({ date: date, description: desc, amount: currentDeposit, type: "income" });

    currentDate = null; currentNarration = ""; currentWithdrawal = 0; currentDeposit = 0;
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.indexOf("Withdrawal Amt") > -1) { inTxns = true; continue; }
    if (!inTxns) continue;
    if (line.indexOf("STATEMENT SUMMARY") > -1 || line.indexOf("End Of Statement") > -1) break;
    if (/^\s*[\*\-]{4,}/.test(line) || !line.trim()) continue;
    if (/HDFC BANK Ltd\.|Statement From|Account No|IFSC|Branch Code|Page No|Date\s+Narration|Nomination|JOINT|A\/C Open|Account Status|Account Branch|Product Code|OD Limit|Cust ID|Address\s|State\s*:|Phone no|Email/.test(line)) continue;

    var dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{2})\s+/);
    if (dateMatch) {
      pushTxn();
      currentDate = dateMatch[1];
      currentWithdrawal = 0;
      currentDeposit = 0;

      // Find all amounts in line using regex with positions
      // Balance is always the last number (pos ~126)
      // If there are 2 numbers: first is withdrawal, second is balance
      // If there are 3 numbers: first is withdrawal, second is deposit, third is balance
      // Key insight: deposit column starts at pos ~100, withdrawal ends before pos ~120
      var amtRe = /[\d,]+\.\d{2}/g;
      var matches = [];
      var m;
      while ((m = amtRe.exec(line)) !== null) {
        matches.push({ pos: m.index, val: parseAmt(m[0]) });
      }
      // Remove the last match (closing balance)
      if (matches.length >= 2) {
        matches.pop(); // remove balance
        for (var mi = 0; mi < matches.length; mi++) {
          if (matches[mi].pos >= 100) {
            currentDeposit = matches[mi].val; // in deposit column
          } else {
            currentWithdrawal = matches[mi].val; // in withdrawal column
          }
        }
      }

      // Extract narration: after date+spaces (col 10), before ref number (16 digits)
      var narPart = line.substring(10);
      narPart = narPart.replace(/\s+\d{16}\s.*$/, "").trim();
      currentNarration = narPart;
    } else if (currentDate) {
      var cont = line.trim();
      // Skip page header continuation lines (address, city, name, etc)
      var skipLine = /^(HDFC|Address|State|Phone|Email|Cust|Nomination|Account|Statement|Branch|Product|OD Limit|MR\s|\d{2},|ANUPURAM|CHENGALPATTU|TAMIL NADU|KALPAKKAM|PUDUPATTINAM|\*\*Continue\*\*)/i.test(cont);
      if (cont && !/^[\d\s,\.\*]+$/.test(cont) && cont.length > 2 && !skipLine) {
        currentNarration += " " + cont;
      }
    }
  }
  pushTxn();
  return txns;
}


function detectAndParseLocally(content) {
  // 1. HDFC Credit Card (tilde delimited)
  if (content.indexOf("~|~") > -1) {
    var cc = parseHDFCCreditCard(content);
    if (cc.length > 0) return { txns: cc, label: "HDFC Credit Card: " + cc.length + " transactions" };
  }
  // 2. HDFC Bank CSV (DD/MM/YY with commas)
  var lines = content.split("\n").filter(function(l) { return l.trim(); });
  for (var i = 0; i < lines.length; i++) {
    if (/\d{2}\/\d{2}\/\d{2}/.test(lines[i]) && lines[i].split(",").length >= 5) {
      var bank = parseHDFCBank(content);
      if (bank.length > 0) return { txns: bank, label: "HDFC Bank: " + bank.length + " transactions" };
      break;
    }
  }
  // 2b. HDFC Bank fixed-width text statement
  if (content.indexOf("Withdrawal Amt") > -1 && content.indexOf("HDFC BANK") > -1) {
    var hdfcTxt = parseHDFCBankText(content);
    if (hdfcTxt.length > 0) return { txns: hdfcTxt, label: "HDFC Bank: " + hdfcTxt.length + " transactions" };
  }
  // 3. Axis Bank CSV (Tran Date,CHQNO,PARTICULARS,DR,CR,BAL,SOL)
  if (content.indexOf("Tran Date") > -1 && content.indexOf("PARTICULARS") > -1 && content.indexOf("UTIB") > -1) {
    var axis = parseAxisBank(content);
    if (axis.length > 0) return { txns: axis, label: "Axis Bank: " + axis.length + " transactions" };
  }
  // 4. Indian Bank fixed-width statement
  if (content.indexOf("ACCOUNT STATEMENT") > -1 || content.indexOf("ACCOUNT ACTIVITY") > -1 ||
      content.indexOf("IDIB") > -1 || /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/.test(content)) {
    var ib = parseIndianBank(content);
    if (ib.length > 0) return { txns: ib, label: "Indian Bank: " + ib.length + " transactions" };
  }
  return null;
}

// ─── Generic CSV parser for other banks (no API) ─────────────────────────────
function parseGenericCSV(content) {
  var lines = content.split("\n").filter(function(l) { return l.trim(); });
  if (lines.length < 2) return null;

  // Try to detect header row
  var headerIdx = -1;
  var header = [];
  for (var i = 0; i < Math.min(5, lines.length); i++) {
    var cols = lines[i].split(",").map(function(c) { return c.replace(/"/g,"").trim().toLowerCase(); });
    if (cols.some(function(c) { return c.indexOf("date") > -1; }) &&
        cols.some(function(c) { return c.indexOf("amount") > -1 || c.indexOf("debit") > -1 || c.indexOf("credit") > -1 || c.indexOf("withdrawal") > -1; })) {
      headerIdx = i;
      header = cols;
      break;
    }
  }
  if (headerIdx === -1) return null;

  // Find column indices
  var dateCol = header.findIndex(function(c) { return c.indexOf("date") > -1; });
  var descCol = header.findIndex(function(c) { return c.indexOf("narration") > -1 || c.indexOf("description") > -1 || c.indexOf("particular") > -1 || c.indexOf("details") > -1 || c.indexOf("remarks") > -1; });
  if (descCol === -1) descCol = header.findIndex(function(c) { return c.indexOf("ref") > -1 || c.indexOf("trans") > -1; });
  var debitCol = header.findIndex(function(c) { return c.indexOf("debit") > -1 || c.indexOf("withdrawal") > -1 || c.indexOf("dr") === c.length - 2; });
  var creditCol = header.findIndex(function(c) { return c.indexOf("credit") > -1 || c.indexOf("deposit") > -1 || c.indexOf("cr") === c.length - 2; });
  var amtCol = header.findIndex(function(c) { return c === "amount" || c === "amt"; });

  if (dateCol === -1) return null;
  if (debitCol === -1 && creditCol === -1 && amtCol === -1) return null;

  var txns = [];
  for (var r = headerIdx + 1; r < lines.length; r++) {
    var row = lines[r].split(",").map(function(c) { return c.replace(/"/g,"").trim(); });
    if (row.length < 3) continue;

    var rawDate = row[dateCol] || "";
    var parsedDate = null;

    // Try common date formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD/MM/YY, MM/DD/YYYY
    var dm1 = rawDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    var dm2 = rawDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (dm1) {
      var yr = dm1[3].length === 2 ? "20" + dm1[3] : dm1[3];
      // Guess DD/MM vs MM/DD: if first part > 12, it must be day
      if (parseInt(dm1[1]) > 12) {
        parsedDate = yr + "-" + dm1[2].padStart(2,"0") + "-" + dm1[1].padStart(2,"0");
      } else {
        parsedDate = yr + "-" + dm1[1].padStart(2,"0") + "-" + dm1[2].padStart(2,"0");
      }
    } else if (dm2) {
      parsedDate = dm2[1] + "-" + dm2[2].padStart(2,"0") + "-" + dm2[3].padStart(2,"0");
    }
    if (!parsedDate || isNaN(new Date(parsedDate).getTime())) continue;

    var desc = descCol > -1 ? (row[descCol] || "") : (row[1] || "");
    if (!desc) continue;

    var debit = debitCol > -1 ? (parseFloat(row[debitCol].replace(/[,\s]/g,"")) || 0) : 0;
    var credit = creditCol > -1 ? (parseFloat(row[creditCol].replace(/[,\s]/g,"")) || 0) : 0;
    var amt = amtCol > -1 ? (parseFloat(row[amtCol].replace(/[,\s]/g,"")) || 0) : 0;

    if (debitCol > -1 || creditCol > -1) {
      if (debit === 0 && credit === 0) continue;
      if (debit > 0) txns.push({ date: parsedDate, description: desc.substring(0,80), amount: debit, type: "expense" });
      if (credit > 0) txns.push({ date: parsedDate, description: desc.substring(0,80), amount: credit, type: "income" });
    } else if (amt !== 0) {
      txns.push({ date: parsedDate, description: desc.substring(0,80), amount: Math.abs(amt), type: amt < 0 ? "expense" : "income" });
    }
  }
  return txns.length > 0 ? { txns: txns, label: "Parsed: " + txns.length + " transactions (review categories)" } : null;
}

function CustomPieTooltip(props) {
  if (!props.active || !props.payload || !props.payload.length) return null;
  var d = props.payload[0];
  var pct = props.total > 0 ? Math.round((d.value / props.total) * 100) : 0;
  return (
    <div style={{ background: "#1a1a24", border: "1px solid #2d2d3d", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <p style={{ margin: "0 0 2px", fontWeight: 600, color: "#e2e8f0" }}>{d.name}</p>
      <p style={{ margin: 0, color: COLORS[d.index % COLORS.length] }}>{fmt(d.value, props.sym)}</p>
      <p style={{ margin: "2px 0 0", color: "#94a3b8" }}>{pct}%</p>
    </div>
  );
}

function CustomWFTooltip(props) {
  if (!props.active || !props.payload || !props.payload.length) return null;
  var d = props.payload[0].payload;
  return (
    <div style={{ background: "#1a1a24", border: "1px solid #2d2d3d", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#e2e8f0" }}>{d.name}</p>
      <p style={{ margin: 0, color: d.fill }}>{fmt(d.value, props.sym)}</p>
      {!d.isIncome && <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 11 }}>Balance after: {fmt(d.end, props.sym)}</p>}
    </div>
  );
}

function TxnModal(props) {
  var defDate = new Date().toISOString().split("T")[0];
  var init = props.txn || { date: defDate, description: "", amount: "", type: "expense", category: "", subcategory: "", accountId: "" };
  var [form, setForm] = useState(init);
  function setF(k, v) { setForm(function(p) { return Object.assign({}, p, { [k]: v }); }); }
  var thp = props.th || makeTheme(true);
  var is = { width: "100%", background: thp.input, border: "1px solid " + thp.border, color: thp.text, padding: "8px 10px", borderRadius: 8, fontSize: 13, boxSizing: "border-box" };
  var catKeys = Object.keys(props.categories).filter(function(c) { return form.type === "income" ? c === "Income" : c !== "Income"; });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" }}>
      <div style={{ background: thp.surface, border: "1px solid " + thp.border, borderRadius: 16, padding: "1.25rem", width: "100%", maxWidth: 400 }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: 15, fontWeight: 700, color: thp.text }}>{props.txn ? "Edit" : "Add"} Transaction</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><label style={{ display: "block", fontSize: 12, color: thp.faint, marginBottom: 3 }}>Date</label><input type="date" value={form.date} onChange={function(e) { setF("date", e.target.value); }} style={is} /></div>
          <div><label style={{ display: "block", fontSize: 12, color: thp.faint, marginBottom: 3 }}>Description</label><input type="text" value={form.description} onChange={function(e) { setF("description", e.target.value); }} style={is} /></div>
          <div><label style={{ display: "block", fontSize: 12, color: thp.faint, marginBottom: 3 }}>Amount</label><input type="number" value={form.amount} onChange={function(e) { setF("amount", e.target.value); }} style={is} /></div>
          <div><label style={{ display: "block", fontSize: 12, color: thp.faint, marginBottom: 3 }}>Type</label>
            <select value={form.type} onChange={function(e) { setF("type", e.target.value); }} style={is}><option value="expense">Expense</option><option value="income">Income</option></select>
          </div>
          <div><label style={{ display: "block", fontSize: 12, color: thp.faint, marginBottom: 3 }}>Category</label>
            <select value={form.category} onChange={function(e) { setF("category", e.target.value); }} style={is}>
              <option value="">Select category</option>
              {catKeys.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>
          {form.category && <div><label style={{ display: "block", fontSize: 12, color: thp.faint, marginBottom: 3 }}>Subcategory</label>
            <select value={form.subcategory || ""} onChange={function(e) { setF("subcategory", e.target.value); }} style={is}>
              <option value="">Select subcategory</option>
              {(props.categories[form.category] || []).map(function(s) { return <option key={s} value={s}>{s}</option>; })}
            </select>
          </div>}
          <div><label style={{ display: "block", fontSize: 12, color: thp.faint, marginBottom: 3 }}>Account</label>
            <select value={form.accountId || ""} onChange={function(e) { setF("accountId", e.target.value); }} style={is}>
              <option value="">Select account</option>
              {(props.accounts || []).map(function(a) { return <option key={a.id} value={a.id}>{a.type} — {a.name}</option>; })}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
          <button onClick={props.onClose} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid " + thp.border, background: "none", color: thp.muted, cursor: "pointer" }}>Cancel</button>
          <button onClick={function() { if (form.description && form.amount) props.onSave(Object.assign({}, form, { amount: parseFloat(form.amount) })); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function AccountPickerModal(props) {
  var [selAcct, setSelAcct] = useState("");
  var [showNew, setShowNew] = useState(false);
  var [newType, setNewType] = useState("Savings");
  var [newName, setNewName] = useState("");
  var is = { width: "100%", background: "#0f0f13", border: "1px solid #2d2d3d", color: "#e2e8f0", padding: "7px 10px", borderRadius: 8, fontSize: 13, boxSizing: "border-box" };
  function addAndSelect() {
    if (!newName.trim()) return;
    var na = { id: "acc" + Date.now(), type: newType, name: newName.trim() };
    props.onAddAccount(na);
    setSelAcct(na.id);
    setShowNew(false);
    setNewName("");
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "1rem" }}>
      <div style={{ background: "#1a1a24", border: "1px solid #2d2d3d", borderRadius: 16, padding: "1.25rem", width: "100%", maxWidth: 420, maxHeight: "80vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Which account is this statement from?</h3>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748b" }}>Select the account so expenses are attributed correctly.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
          {props.accounts.map(function(a) {
            var c = ACCT_COLORS[a.type] || "#888";
            var sel = selAcct === a.id;
            return (
              <button key={a.id} onClick={function() { setSelAcct(a.id); }} style={{ padding: "10px 14px", borderRadius: 10, border: "2px solid " + (sel ? c : "#2d2d3d"), background: sel ? c + "22" : "#0f0f13", color: "#e2e8f0", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13 }}>{a.name}</span>
                <span style={{ fontSize: 11, color: c, background: c + "22", padding: "2px 8px", borderRadius: 6 }}>{a.type}</span>
              </button>
            );
          })}
        </div>
        {showNew ? (
          <div style={{ background: "#0f0f13", borderRadius: 10, padding: 12, marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 3 }}>Type</label>
                <select value={newType} onChange={function(e) { setNewType(e.target.value); }} style={is}>
                  {ACCOUNT_TYPES.map(function(t) { return <option key={t} value={t}>{t}</option>; })}
                </select>
              </div>
              <div><label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 3 }}>Name</label>
                <input style={is} placeholder="e.g. ICICI Savings" value={newName} onChange={function(e) { setNewName(e.target.value); }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addAndSelect} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Add & Select</button>
              <button onClick={function() { setShowNew(false); }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #2d2d3d", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={function() { setShowNew(true); }} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px dashed #2d2d3d", background: "none", color: "#6366f1", cursor: "pointer", fontSize: 12, marginBottom: 12 }}>+ Add New Account</button>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={props.onCancel} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #2d2d3d", background: "none", color: "#94a3b8", cursor: "pointer" }}>Cancel</button>
          <button onClick={function() { if (selAcct) props.onConfirm(selAcct); }} disabled={!selAcct} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: selAcct ? "#6366f1" : "#3730a3", color: "#fff", cursor: selAcct ? "pointer" : "not-allowed", fontWeight: 600 }}>Continue →</button>
        </div>
      </div>
    </div>
  );
}

function CCDateModal(props) {
  var [option, setOption] = useState("actual");
  var now = new Date();
  var [reflectDay, setReflectDay] = useState(1);
  var [reflectMonth, setReflectMonth] = useState(now.getMonth());
  var [reflectYear, setReflectYear] = useState(now.getFullYear());
  var yearOptions = Array.from({ length: 5 }, function(_, i) { return now.getFullYear() - 1 + i; });
  // Days in selected month for "specific date" option
  var daysInMonth = new Date(reflectYear, reflectMonth + 1, 0).getDate();
  var dayOptions = Array.from({ length: daysInMonth }, function(_, i) { return i + 1; });

  function handleConfirm() {
    if (option === "actual") { props.onConfirm(null); return; }
    if (option === "reflect") { props.onConfirm({ month: reflectMonth, year: reflectYear, day: null }); return; }
    if (option === "specificdate") { props.onConfirm({ month: reflectMonth, year: reflectYear, day: reflectDay }); return; }
  }

  var sel = { background: "#312e81", border: "2px solid #6366f1" };
  var unsel = { background: "transparent", border: "2px solid #2d2d3d" };
  var inp = { background: "#0f0f13", border: "1px solid #2d2d3d", color: "#e2e8f0", padding: "8px 10px", borderRadius: 8, fontSize: 13 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "1rem" }}>
      <div style={{ background: "#1a1a24", border: "1px solid #2d2d3d", borderRadius: 16, padding: "1.25rem", width: "100%", maxWidth: 440 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Credit Card — Billing Cycle</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>How would you like to reflect these transactions?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {[
            ["actual", "Use actual transaction dates", "Keep the original dates from the statement"],
            ["reflect", "Reflect in a different month", "Shift all entries to the month you'll pay the bill"],
            ["specificdate", "Reflect in a specific date", "Set a single date for all entries (e.g. your bill due date)"]
          ].map(function(opt) {
            return (
              <label key={opt[0]} onClick={function() { setOption(opt[0]); }} style={{ display: "flex", gap: 10, cursor: "pointer", padding: 12, borderRadius: 10, ...(option === opt[0] ? sel : unsel) }}>
                <input type="radio" name="ccdate" value={opt[0]} checked={option === opt[0]} onChange={function() { setOption(opt[0]); }} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{opt[1]}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{opt[2]}</div>
                </div>
              </label>
            );
          })}
        </div>
        {option === "reflect" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <select value={reflectMonth} onChange={function(e) { setReflectMonth(parseInt(e.target.value)); }} style={{ flex: 1, ...inp }}>
              {MONTHS.map(function(m, i) { return <option key={m} value={i}>{m}</option>; })}
            </select>
            <select value={reflectYear} onChange={function(e) { setReflectYear(parseInt(e.target.value)); }} style={{ flex: 1, ...inp }}>
              {yearOptions.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
            </select>
          </div>
        )}
        {option === "specificdate" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <select value={reflectDay} onChange={function(e) { setReflectDay(parseInt(e.target.value)); }} style={{ flex: 1, ...inp }}>
              {dayOptions.map(function(d) { return <option key={d} value={d}>{d}</option>; })}
            </select>
            <select value={reflectMonth} onChange={function(e) { var newMonth = parseInt(e.target.value); var maxD = new Date(reflectYear, newMonth + 1, 0).getDate(); setReflectMonth(newMonth); setReflectDay(function(d) { return Math.min(d, maxD); }); }} style={{ flex: 2, ...inp }}>
              {MONTHS.map(function(m, i) { return <option key={m} value={i}>{m}</option>; })}
            </select>
            <select value={reflectYear} onChange={function(e) { setReflectYear(parseInt(e.target.value)); }} style={{ flex: 1, ...inp }}>
              {yearOptions.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
            </select>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() { props.onConfirm(null); }} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #2d2d3d", background: "none", color: "#94a3b8", cursor: "pointer" }}>Skip</button>
          <button onClick={handleConfirm} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function AddAccountInline(props) {
  var [newAcctType, setNewAcctType] = useState("Savings");
  var [newAcctName, setNewAcctName] = useState("");
  var thp = props.th || makeTheme(true);
  function add() {
    if (!newAcctName.trim()) return;
    props.onAdd({ id: "acc" + Date.now(), type: newAcctType, name: newAcctName.trim() });
    setNewAcctName("");
  }
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <select value={newAcctType} onChange={function(e) { setNewAcctType(e.target.value); }} style={{ background: thp.surface, border: "1px solid " + thp.border, color: thp.text, padding: "8px 12px", borderRadius: 8, fontSize: 13 }}>
        {ACCOUNT_TYPES.map(function(t) { return <option key={t} value={t}>{t}</option>; })}
      </select>
      <input placeholder="Account name (e.g. HDFC Savings)" value={newAcctName} onChange={function(e) { setNewAcctName(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") add(); }} style={{ background: thp.input, border: "1px solid " + thp.border, color: thp.text, padding: "8px 12px", borderRadius: 8, fontSize: 13, flex: 1, minWidth: 180 }} />
      <button onClick={add} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Add Account</button>
    </div>
  );
}


function makeTheme(dark) {
  return {
    bg:       dark ? "#0f0f13" : "#f1f5f9",
    surface:  dark ? "#1a1a24" : "#ffffff",
    surface2: dark ? "#1e1e2e" : "#f8fafc",
    border:   dark ? "#2d2d3d" : "#e2e8f0",
    text:     dark ? "#e2e8f0" : "#1e293b",
    muted:    dark ? "#94a3b8" : "#64748b",
    faint:    dark ? "#64748b" : "#94a3b8",
    input:    dark ? "#0f0f13" : "#f8fafc",
    navbg:    dark ? "#1a1a24" : "#ffffff",
    navact:   dark ? "#6366f1" : "#6366f1",
    danger:   dark ? "#450a0a" : "#fee2e2",
    success:  dark ? "#052e16" : "#dcfce7",
  };
}

export default function App() {
  var now = new Date();
  var [tab, setTab] = useState("Dashboard");
  var [mobileMenu, setMobileMenu] = useState(false);
  var [currency, setCurrency] = useState(CURRENCIES[0]);
  var [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  var [transactions, setTransactions] = useState([]);
  var [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  var [cycleStart, setCycleStart] = useState(1);
  var [cycleEnd, setCycleEnd] = useState(28);
  var [selMonth, setSelMonth] = useState(now.getMonth());
  var [selYear, setSelYear] = useState(now.getFullYear());
  var [parsedTxns, setParsedTxns] = useState([]);
  var [parsing, setParsing] = useState(false);
  var [parseError, setParseError] = useState("");
  var [pdfPassword, setPdfPassword] = useState("");
  var [pendingFile, setPendingFile] = useState(null);
  var [parseDebug, setParseDebug] = useState("");
  var [allParsedTxns, setAllParsedTxns] = useState([]);
  var [showCyclePicker, setShowCyclePicker] = useState(false);
  var [cyclePickerMonth, setCyclePickerMonth] = useState(now.getMonth());
  var [cyclePickerYear, setCyclePickerYear] = useState(now.getFullYear());
  var [showAddModal, setShowAddModal] = useState(false);
  var [editTxn, setEditTxn] = useState(null);
  var [newCat, setNewCat] = useState("");
  var [newSub, setNewSub] = useState({});
  var [drillCat, setDrillCat] = useState(null);
  var [drillSavCat, setDrillSavCat] = useState(null);
  var [storageReady, setStorageReady] = useState(false);
  var [confirmClear, setConfirmClear] = useState(false);
  var [carryForward, setCarryForward] = useState(false);
  var [darkMode, setDarkMode] = useState(true);
  var th = makeTheme(darkMode);
  var [showAccountPicker, setShowAccountPicker] = useState(false);
  var [pendingParsedTxns, setPendingParsedTxns] = useState([]);
  var [showCCDateModal, setShowCCDateModal] = useState(false);
  var [pickedAccountId, setPickedAccountId] = useState("");
  var fileRef = useRef();
  var importRef = useRef();
  var sym = currency.symbol;
  var yearOptions = Array.from({ length: 10 }, function(_, i) { return now.getFullYear() - 5 + i; });

  // Load from localStorage on mount
  useEffect(function() {
    try {
      var tx = store.get("wt:tx");
      if (tx) {
        var parsed = JSON.parse(tx.value);
        var expanded = parsed.map(function(t) {
          return { id: t.id, date: t.date, description: t.desc || t.description || "", amount: t.amt || t.amount, type: t.type, category: t.cat || t.category || "", subcategory: t.sub || t.subcategory || "", accountId: t.aid || t.accountId || "", originalDate: t.od || t.originalDate || "" };
        });
        setTransactions(expanded);
      }
      var cat = store.get("wt:cat"); if (cat) setCategories(JSON.parse(cat.value));
      var accts = store.get("wt:accts"); if (accts) setAccounts(JSON.parse(accts.value));
      var cfg = store.get("wt:cfg");
      if (cfg) {
        var s = JSON.parse(cfg.value);
        if (s.cycleStart) setCycleStart(s.cycleStart);
        if (s.cycleEnd) setCycleEnd(s.cycleEnd);
        if (s.currency) { var c = CURRENCIES.find(function(x) { return x.code === s.currency; }); if (c) setCurrency(c); }
        if (s.selMonth !== undefined) setSelMonth(s.selMonth);
        if (s.selYear) setSelYear(s.selYear);
        if (s.darkMode !== undefined) setDarkMode(s.darkMode);
        if (s.carryForward !== undefined) setCarryForward(s.carryForward);
      }
    } catch(e) {}
    setStorageReady(true);
  }, []);

  useEffect(function() {
    if (!storageReady) return;
    var slim = transactions.map(function(t) {
      var o = { id: t.id, date: t.date, desc: t.description, amt: t.amount, type: t.type };
      if (t.category) o.cat = t.category;
      if (t.subcategory) o.sub = t.subcategory;
      if (t.accountId) o.aid = t.accountId;
      if (t.originalDate) o.od = t.originalDate;
      return o;
    });
    store.set("wt:tx", JSON.stringify(slim));
  }, [transactions, storageReady]);
  useEffect(function() { if (storageReady) store.set("wt:cat", JSON.stringify(categories)); }, [categories, storageReady]);
  useEffect(function() { if (storageReady) store.set("wt:accts", JSON.stringify(accounts)); }, [accounts, storageReady]);
  useEffect(function() { if (storageReady) store.set("wt:cfg", JSON.stringify({ cycleStart, cycleEnd, currency: currency.code, selMonth, selYear, darkMode, carryForward })); }, [cycleStart, cycleEnd, currency, selMonth, selYear, darkMode, carryForward, storageReady]);

  function filterToCycle(txns, month, year) {
    var s = new Date(year, month, cycleStart);
    // Use end of the cycle end day (23:59:59) so the end date is fully inclusive
    var e = cycleEnd < cycleStart
      ? new Date(year, month + 1, cycleEnd, 23, 59, 59)
      : new Date(year, month, cycleEnd, 23, 59, 59);
    return txns.filter(function(t) { var d = new Date(t.date); return d >= s && d <= e; });
  }

  function isYearlyStatement(txns) {
    var dates = txns.map(function(t) { return new Date(t.date); }).filter(function(d) { return !isNaN(d.getTime()); });
    if (dates.length < 2) return false;
    var mn = new Date(Math.min.apply(null, dates)), mx = new Date(Math.max.apply(null, dates));
    return (mx.getFullYear() - mn.getFullYear()) * 12 + (mx.getMonth() - mn.getMonth()) >= 3;
  }

  var getMonthTxns = useCallback(function() {
    return filterToCycle(transactions, selMonth, selYear);
  }, [transactions, selMonth, selYear, cycleStart, cycleEnd]);

  var monthTxns = getMonthTxns();
  var income = monthTxns.filter(function(t) { return t.type === "income"; }).reduce(function(a, b) { return a + b.amount; }, 0);
  var expense = monthTxns.filter(function(t) { return t.type === "expense"; }).reduce(function(a, b) { return a + b.amount; }, 0);
  var savings = income - expense;

  // Carry forward: cumulative net savings from all months before current cycle
  var openingBalance = 0;
  if (carryForward) {
    var cycleStartDate = new Date(selYear, selMonth, cycleStart);
    openingBalance = transactions.reduce(function(sum, t) {
      var d = new Date(t.date);
      if (d < cycleStartDate) {
        return sum + (t.type === "income" ? t.amount : -t.amount);
      }
      return sum;
    }, 0);
  }
  var closingBalance = openingBalance + savings;

  function groupBy(arr, key) {
    var m = {};
    arr.forEach(function(t) { var k = t[key] || "Other"; m[k] = (m[k] || 0) + t.amount; });
    return Object.keys(m).map(function(n) { return { name: n, value: m[n] }; });
  }

  var expPieData = drillCat
    ? groupBy(monthTxns.filter(function(t) { return t.type === "expense" && t.category === drillCat; }), "subcategory")
    : groupBy(monthTxns.filter(function(t) { return t.type === "expense"; }), "category");
  var expPieTotal = drillCat ? monthTxns.filter(function(t) { return t.type === "expense" && t.category === drillCat; }).reduce(function(a, b) { return a + b.amount; }, 0) : expense;
  var savPieData = drillSavCat
    ? groupBy(monthTxns.filter(function(t) { return t.category === "Savings" && (t.subcategory || "Other") === drillSavCat; }), "description")
    : groupBy(monthTxns.filter(function(t) { return t.category === "Savings"; }), "subcategory");
  var savPieTotal = savPieData.reduce(function(a, b) { return a + b.value; }, 0);

  var acctExpTxns = monthTxns.filter(function(t) { return t.type === "expense"; });
  var acctPieMap = {};
  acctExpTxns.forEach(function(t) {
    var acct = accounts.find(function(a) { return a.id === t.accountId; });
    var k = acct ? acct.name : "Unknown";
    acctPieMap[k] = (acctPieMap[k] || 0) + t.amount;
  });
  var acctPieData = Object.keys(acctPieMap).map(function(n) { return { name: n, value: acctPieMap[n] }; });
  var acctPieTotal = acctExpTxns.reduce(function(a, b) { return a + b.amount; }, 0);

  function wfData() {
    var cats = {};
    monthTxns.filter(function(t) { return t.type === "expense"; }).forEach(function(t) { var k = t.category || "Other"; cats[k] = (cats[k] || 0) + t.amount; });
    var rows = [{ name: "Income", start: 0, end: income, value: income, fill: "#10b981", isIncome: true }];
    var cursor = income;
    Object.keys(cats).forEach(function(k) { var v = cats[k]; rows.push({ name: k, start: cursor - v, end: cursor, value: v, fill: "#ef4444" }); cursor -= v; });
    rows.push({ name: "Cash", start: 0, end: Math.max(cursor, 0), value: Math.max(cursor, 0), fill: "#6366f1" });
    return rows;
  }

  function finalizeParsedWithAccount(txns, accountId, reflectDate) {
    var result = txns.map(function(t) {
      var txn = Object.assign({}, t, { accountId: accountId });
      if (reflectDate) {
        var orig = new Date(t.date);
        // If user picked a specific day, all entries get that exact date
        // If only month+year, keep the original day of month
        var day = (reflectDate.day != null) ? reflectDate.day : orig.getDate();
        // Clamp day to valid range for the target month
        var maxDay = new Date(reflectDate.year, reflectDate.month + 1, 0).getDate();
        day = Math.min(day, maxDay);
        // Build date string directly to avoid UTC timezone shift
        var sy = reflectDate.year;
        var sm = String(reflectDate.month + 1).padStart(2, "0");
        var sd = String(day).padStart(2, "0");
        txn.date = sy + "-" + sm + "-" + sd;
        txn.originalDate = t.date;
      }
      return txn;
    });
    setParsedTxns(result);
    setPendingParsedTxns([]);
    setPickedAccountId("");
  }

  function onAccountConfirmed(accountId) {
    setShowAccountPicker(false);
    setPickedAccountId(accountId);
    var acct = accounts.find(function(a) { return a.id === accountId; });
    if (acct && acct.type === "Credit Card") {
      setShowCCDateModal(true);
    } else {
      finalizeParsedWithAccount(pendingParsedTxns, accountId, null);
    }
  }

  function onCCDateConfirmed(reflectDate) {
    setShowCCDateModal(false);
    finalizeParsedWithAccount(pendingParsedTxns, pickedAccountId, reflectDate);
  }

  function stageParsedTxns(withIds) {
    setPendingParsedTxns(withIds);
    setShowAccountPicker(true);
  }

  function applyLocalResult(result) {
    var categorized = localCategorize(result.txns);
    var withIds = categorized.map(function(t, i) { return Object.assign({}, t, { id: "p" + i }); });
    setParseDebug(result.label);
    setParsing(false);
    if (isYearlyStatement(withIds)) {
      setAllParsedTxns(withIds);
      var dates = withIds.map(function(t) { return new Date(t.date); }).filter(function(d) { return !isNaN(d.getTime()); });
      var latest = new Date(Math.max.apply(null, dates));
      setCyclePickerMonth(latest.getMonth()); setCyclePickerYear(latest.getFullYear());
      setShowCyclePicker(true);
    } else {
      stageParsedTxns(withIds);
    }
  }

  function processContent(content) {
    // 1. Try HDFC-specific parsers first
    var local = detectAndParseLocally(content);
    if (local) { applyLocalResult(local); return; }

    // 2. Try generic CSV parser (no API needed)
    var generic = parseGenericCSV(content);
    if (generic) { applyLocalResult(generic); return; }

    // 3. Nothing worked — show helpful error
    setParseError("Could not auto-detect format. Please download your statement as CSV/Excel from your bank's net banking and try again. HDFC Bank & Credit Card statements are fully supported.");
    setParsing(false);
  }

  function applyMonthFilter(month, year) {
    setShowCyclePicker(false);
    var filtered = filterToCycle(allParsedTxns, month, year);
    if (filtered.length === 0) { setParseError("No transactions for " + MONTHS[month] + " " + year + "."); setShowCyclePicker(true); return; }
    var withIds = filtered.map(function(t, i) { return Object.assign({}, t, { id: "p" + i, category: t.category || "", subcategory: t.subcategory || "", autocat: t.autocat || "low" }); });
    setSelMonth(month); setSelYear(year);
    stageParsedTxns(withIds);
  }

  function loadScript(url) {
    return new Promise(function(res, rej) { var s = document.createElement("script"); s.src = url; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }

  function parseStatement(file, password) {
    if (!password) password = "";
    setParsing(true); setParseError(""); setParseDebug(""); setParsedTxns([]);
    var ext = file.name.split(".").pop().toLowerCase();

    if (ext === "pdf") {
      var pdfLib = window.pdfjsLib ? Promise.resolve() : loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js").then(function() { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; });
      pdfLib.then(function() { return file.arrayBuffer(); })
        .then(function(buf) { return window.pdfjsLib.getDocument({ data: buf, password: password || undefined }).promise; })
        .then(function(pdf) {
          function doPage(i, acc) {
            if (i > pdf.numPages) return Promise.resolve(acc);
            return pdf.getPage(i).then(function(pg) { return pg.getTextContent(); }).then(function(tc) {
              var rows = {};
              tc.items.forEach(function(it) { var y = Math.round(it.transform[5]); if (!rows[y]) rows[y] = []; rows[y].push({ x: Math.round(it.transform[4]), str: it.str }); });
              Object.keys(rows).map(Number).sort(function(a, b) { return b - a; }).forEach(function(y) { acc += rows[y].sort(function(a, b) { return a.x - b.x; }).map(function(r) { return r.str; }).join(" ") + "\n"; });
              return doPage(i + 1, acc + "\n");
            });
          }
          return doPage(1, "").then(function(text) {
            text = text.replace(/[^\x20-\x7E\n\t]/g, " ").replace(/[ \t]{3,}/g, "  ").replace(/\n{4,}/g, "\n\n");
            if (!text.trim()) throw new Error("empty_pdf");
            setParseDebug("PDF: " + pdf.numPages + "p, " + text.length + " chars");
            processContent(text);
          });
        })
        .catch(function(pe) {
          var msg = String(pe);
          if ((pe && pe.name === "PasswordException") || msg.indexOf("password") > -1) { setParsing(false); setPendingFile(file); setParseError("password_required"); return; }
          if (msg.indexOf("empty_pdf") > -1) { setParseError("Image-based PDF. Please download the statement as CSV/Excel from net banking instead."); setParsing(false); return; }
          setParseError("PDF parsing failed: " + pe.message); setParsing(false);
        });

    } else if (ext === "xls" || ext === "xlsx") {
      var xlsLib = window.XLSX ? Promise.resolve() : loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
      xlsLib.then(function() { return file.arrayBuffer(); })
        .then(function(buf) {
          var wb = window.XLSX.read(buf, { type: "array", cellDates: true, raw: false });
          var csv = window.XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], { blankrows: false, defval: "" });
          if (!csv || !csv.trim()) throw new Error("Empty sheet");
          setParseDebug("Excel: " + csv.length + " chars");
          processContent(csv);
        })
        .catch(function() {
          file.arrayBuffer().then(function(buf) {
            var bytes = new Uint8Array(buf), txt = "";
            for (var i = 0; i < bytes.length; i++) { var c = bytes[i]; if (c >= 32 && c < 127) txt += String.fromCharCode(c); else if ((c === 10 || c === 13) && txt.slice(-1) !== "\n") txt += "\n"; }
            processContent(txt.replace(/\n{3,}/g, "\n\n"));
          });
        });

    } else {
      file.text().then(function(text) {
        setParseDebug("Text: " + text.length + " chars");
        processContent(text);
      }).catch(function(e) { setParseError("Read failed: " + e.message); setParsing(false); });
    }
  }

  function confirmParsed() {
    var confirmed = parsedTxns.map(function(t) { return Object.assign({}, t, { id: "t" + Date.now() + Math.random() }); });
    setTransactions(function(prev) { return prev.concat(confirmed); });
    setParsedTxns([]); setTab("Transactions");
  }
  function deleteTxn(id) { setTransactions(function(prev) { return prev.filter(function(t) { return t.id !== id; }); }); }
  function saveTxn(txn) {
    if (editTxn) { setTransactions(function(prev) { return prev.map(function(t) { return t.id === txn.id ? txn : t; }); }); setEditTxn(null); }
    else { setTransactions(function(prev) { return prev.concat([Object.assign({}, txn, { id: "t" + Date.now() })]); }); setShowAddModal(false); }
  }

  function exportData(format) {
    var rows = monthTxns.map(function(t) { return [t.date, '"' + (t.description || "").replace(/"/g, '""') + '"', t.type, t.category || "", t.subcategory || "", t.amount]; });
    if (format === "csv") {
      downloadFile(["Date,Description,Type,Category,Subcategory,Amount"].concat(rows.map(function(r) { return r.join(","); })).join("\n"), "wealth_report.csv", "text/csv");
    } else {
      var sep = new Array(51).join("=");
      var savRate = income > 0 ? Math.round((savings / income) * 100) : 0;
      var body = ["PERSONAL WEALTH TRACKER - " + MONTHS[selMonth] + " " + selYear, sep, "Currency: " + currency.code, "Cycle: Day " + cycleStart + " to " + cycleEnd, "", "SUMMARY", "Income:   " + fmt(income, sym), "Expenses: " + fmt(expense, sym), "Savings:  " + fmt(savings, sym), "Rate:     " + savRate + "%", "", "TRANSACTIONS", new Array(81).join("-"), rows.map(function(r) { return r.join(" | "); }).join("\n")].join("\n");
      downloadFile(body, "wealth_report.txt", "text/plain");
    }
  }

  function exportJSON() {
    var data = { transactions, categories, accounts, settings: { cycleStart, cycleEnd, currency: currency.code } };
    downloadFile(JSON.stringify(data, null, 2), "wealthtrack_backup_" + new Date().toISOString().split("T")[0] + ".json", "application/json");
  }

  function importJSON(file) {
    var r = new FileReader();
    r.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        if (data.transactions) setTransactions(data.transactions);
        if (data.categories) setCategories(data.categories);
        if (data.accounts) setAccounts(data.accounts);
        if (data.settings) {
          if (data.settings.cycleStart) setCycleStart(data.settings.cycleStart);
          if (data.settings.cycleEnd) setCycleEnd(data.settings.cycleEnd);
          if (data.settings.currency) { var c = CURRENCIES.find(function(x) { return x.code === data.settings.currency; }); if (c) setCurrency(c); }
        }
        alert("Restored! " + ((data.transactions && data.transactions.length) || 0) + " transactions loaded.");
      } catch(err) { alert("Invalid backup file."); }
    };
    r.readAsText(file);
  }

  function clearAllData() { setConfirmClear(false); setTransactions([]); setCategories(DEFAULT_CATEGORIES); setAccounts(DEFAULT_ACCOUNTS); store.del("wt:tx"); store.del("wt:cat"); store.del("wt:cfg"); store.del("wt:accts"); }
  function navTo(t) { setTab(t); setMobileMenu(false); }
  function prevMonth() { var m = selMonth === 0 ? 11 : selMonth - 1; var y = selMonth === 0 ? selYear - 1 : selYear; setSelMonth(m); setSelYear(y); setDrillCat(null); }
  function nextMonth() { var m = selMonth === 11 ? 0 : selMonth + 1; var y = selMonth === 11 ? selYear + 1 : selYear; setSelMonth(m); setSelYear(y); setDrillCat(null); }

  var uncatCount = parsedTxns.filter(function(t) { return !t.category || t.autocat === "low"; }).length;
  var autoCatCount = parsedTxns.filter(function(t) { return t.category && t.autocat === "high"; }).length;

  if (!storageReady) return (
    <div style={{ minHeight: "100vh", background: th.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>₿</div>
      <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Loading your data...</p>
    </div>
  );

  var wfd = wfData(), maxV = (income || 1000) * 1.1;
  var is = { width: "100%", background: th.input, border: "1px solid " + th.border, color: th.text, padding: "8px 10px", borderRadius: 8, fontSize: 13, boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: th.bg, color: th.text, fontFamily: "system-ui,sans-serif", transition: "background 0.2s, color 0.2s" }}>
      <style>{".gmob{display:none}.gdesk{display:flex}@media(max-width:640px){.g3{grid-template-columns:1fr!important}.g2{grid-template-columns:1fr!important}.gdesk{display:none!important}.gmob{display:block!important}.otx td,.otx th{padding:5px 4px!important;font-size:11px!important}}"}</style>

      <div style={{ background: th.navbg, borderBottom: "1px solid " + th.border, padding: "0 1rem", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>₿</div>
            <span style={{ fontWeight: 700, fontSize: 16, background: "linear-gradient(135deg,#6366f1,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>WealthTrack</span>
          </div>
          <nav className="gdesk" style={{ gap: 2, alignItems: "center" }}>
            {TABS.map(function(t) { return <button key={t} onClick={function() { setTab(t); }} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: tab === t ? "#6366f1" : "transparent", color: tab === t ? "#fff" : th.muted, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>{t}</button>; })}
          </nav>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={function() { setDarkMode(function(d) { return !d; }); }} style={{ background: "none", border: "1px solid " + th.border, color: th.muted, borderRadius: 8, padding: "5px 9px", cursor: "pointer", fontSize: 15 }}>{darkMode ? "☀️" : "🌙"}</button>
            <button className="gmob" onClick={function() { setMobileMenu(function(p) { return !p; }); }} style={{ background: "none", border: "1px solid " + th.border, color: th.muted, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 18 }}>☰</button>
          </div>
        </div>
        {mobileMenu && <div style={{ borderTop: "1px solid " + th.border, padding: "8px 0", background: th.navbg }}>
          {TABS.map(function(t) { return <button key={t} onClick={function() { navTo(t); }} style={{ display: "block", width: "100%", padding: "10px 1rem", background: tab === t ? "#312e81" : "none", border: "none", color: tab === t ? "#c7d2fe" : th.muted, cursor: "pointer", fontSize: 14, textAlign: "left" }}>{t}</button>; })}
        </div>}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>

        {tab === "Dashboard" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: th.text }}>Overview</h2>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: th.surface, border: "1px solid " + th.border, borderRadius: 10, padding: "5px 8px" }}>
                  <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, padding: "0 2px" }}>‹</button>
                  <select value={selMonth} onChange={function(e) { setSelMonth(Number(e.target.value)); setDrillCat(null); }} style={{ background: "transparent", border: "none", color: th.text, fontSize: 13, fontWeight: 600, cursor: "pointer", outline: "none" }}>
                    {MONTHS.map(function(m, i) { return <option key={m} value={i} style={{ background: th.surface, color: th.text }}>{m.slice(0,3)}</option>; })}
                  </select>
                  <select value={selYear} onChange={function(e) { setSelYear(Number(e.target.value)); setDrillCat(null); }} style={{ background: "transparent", border: "none", color: darkMode ? "#a5b4fc" : "#6366f1", fontSize: 13, fontWeight: 600, cursor: "pointer", outline: "none" }}>
                    {yearOptions.map(function(y) { return <option key={y} value={y} style={{ background: th.surface, color: th.text }}>{y}</option>; })}
                  </select>
                  <button onClick={nextMonth} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, padding: "0 2px" }}>›</button>
                </div>
                <button onClick={function() { exportData("csv"); }} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid " + th.border, background: th.surface, color: th.muted, cursor: "pointer", fontSize: 12 }}>↓ CSV</button>
                <button onClick={function() { exportData("txt"); }} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid " + th.border, background: th.surface, color: th.muted, cursor: "pointer", fontSize: 12 }}>↓ Report</button>
              </div>
            </div>

            <div className="g3" style={{ display: "grid", gridTemplateColumns: carryForward ? "repeat(5,1fr)" : "repeat(3,1fr)", gap: 10, marginBottom: "1rem" }}>
              {carryForward && <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: th.faint, textTransform: "uppercase", letterSpacing: 1 }}>Opening Balance</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: openingBalance >= 0 ? "#10b981" : "#ef4444" }}>{fmt(openingBalance, sym)}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: th.faint }}>Before this cycle</p>
              </div>}
              <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: th.faint, textTransform: "uppercase", letterSpacing: 1 }}>Income</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#10b981" }}>{fmt(income, sym)}</p>
              </div>
              <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: th.faint, textTransform: "uppercase", letterSpacing: 1 }}>Expenses</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#ef4444" }}>{fmt(expense, sym)}</p>
              </div>
              <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: th.faint, textTransform: "uppercase", letterSpacing: 1 }}>Net Savings</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: savings >= 0 ? "#6366f1" : "#ef4444" }}>{fmt(savings, sym)}</p>
                {income > 0 && <p style={{ margin: "3px 0 0", fontSize: 11, color: th.faint }}>{Math.round((savings/income)*100)}% savings rate</p>}
              </div>
              {carryForward && <div style={{ background: th.surface, border: "2px solid #6366f1", borderRadius: 12, padding: "12px 14px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: th.faint, textTransform: "uppercase", letterSpacing: 1 }}>Closing Balance</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: closingBalance >= 0 ? "#6366f1" : "#ef4444" }}>{fmt(closingBalance, sym)}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: th.faint }}>Cumulative net</p>
              </div>}
            </div>

            <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: th.text }}>{drillCat ? drillCat : "Expenses"}</h3>
                  {drillCat && <button onClick={function() { setDrillCat(null); }} style={{ fontSize: 12, color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>← Back</button>}
                </div>
                {expPieData.length > 0 ? <div>
                  <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={expPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" onClick={function(d) { if (!drillCat) setDrillCat(d.name); }}>{expPieData.map(function(_, i) { return <Cell key={i} fill={COLORS[i % COLORS.length]} cursor={drillCat ? "default" : "pointer"} />; })}</Pie><Tooltip content={function(p) { return <CustomPieTooltip active={p.active} payload={p.payload} total={expPieTotal} sym={sym} />; }} /></PieChart></ResponsiveContainer>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>{expPieData.map(function(d, i) { return <span key={d.name} onClick={function() { if (!drillCat) setDrillCat(d.name); }} style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, color: th.muted, cursor: drillCat ? "default" : "pointer" }}><span style={{ width: 7, height: 7, borderRadius: 1, background: COLORS[i % COLORS.length], display: "inline-block" }}></span>{d.name} {expPieTotal > 0 ? Math.round((d.value/expPieTotal)*100) : 0}%</span>; })}</div>
                  {!drillCat && <p style={{ fontSize: 10, color: th.faint, margin: "6px 0 0" }}>Click slice to drill down</p>}
                </div> : <p style={{ color: th.faint, fontSize: 13, textAlign: "center", marginTop: 40 }}>No expense data</p>}
              </div>
              <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: th.text }}>{drillSavCat ? drillSavCat : "Savings"}</h3>
                  {drillSavCat && <button onClick={function() { setDrillSavCat(null); }} style={{ fontSize: 12, color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}>← Back</button>}
                </div>
                {savPieData.length > 0 ? <div>
                  <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={savPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" onClick={function(d) { if (!drillSavCat) setDrillSavCat(d.name); }}>{savPieData.map(function(_, i) { return <Cell key={i} fill={COLORS[(i+4) % COLORS.length]} cursor={drillSavCat ? "default" : "pointer"} />; })}</Pie><Tooltip content={function(p) { return <CustomPieTooltip active={p.active} payload={p.payload} total={savPieTotal} sym={sym} />; }} /></PieChart></ResponsiveContainer>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>{savPieData.map(function(d, i) { return <span key={d.name} onClick={function() { if (!drillSavCat) setDrillSavCat(d.name); }} style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, color: th.muted, cursor: drillSavCat ? "default" : "pointer" }}><span style={{ width: 7, height: 7, borderRadius: 1, background: COLORS[(i+4) % COLORS.length], display: "inline-block" }}></span>{d.name} {savPieTotal > 0 ? Math.round((d.value/savPieTotal)*100) : 0}%</span>; })}</div>
                  {!drillSavCat && <p style={{ fontSize: 10, color: th.faint, margin: "6px 0 0" }}>Click slice to drill down</p>}
                </div> : <p style={{ color: th.faint, fontSize: 13, textAlign: "center", marginTop: 40 }}>No savings tagged under "Savings" category</p>}
              </div>
            </div>

            <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "1rem", marginBottom: 12 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600 }}>Expenses by Account</h3>
              {acctPieData.length > 0 ? <div>
                <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={acctPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value">{acctPieData.map(function(d, i) { var acct = accounts.find(function(a) { return a.name === d.name; }); var c = acct ? (ACCT_COLORS[acct.type] || COLORS[i % COLORS.length]) : COLORS[i % COLORS.length]; return <Cell key={i} fill={c} />; })}</Pie><Tooltip content={function(p) { return <CustomPieTooltip active={p.active} payload={p.payload} total={acctPieTotal} sym={sym} />; }} /></PieChart></ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>{acctPieData.map(function(d, i) { var acct = accounts.find(function(a) { return a.name === d.name; }); var c = acct ? (ACCT_COLORS[acct.type] || COLORS[i % COLORS.length]) : COLORS[i % COLORS.length]; return <span key={d.name} style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, color: th.muted }}><span style={{ width: 7, height: 7, borderRadius: 1, background: c, display: "inline-block" }}></span>{d.name} {acctPieTotal > 0 ? Math.round((d.value/acctPieTotal)*100) : 0}%</span>; })}</div>
              </div> : <p style={{ color: th.faint, fontSize: 13, textAlign: "center", padding: "1.5rem 0" }}>No account data — assign accounts to transactions</p>}
            </div>

            <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "1rem" }}>
              <h3 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600 }}>Income waterfall</h3>
              <p style={{ margin: "0 0 12px", fontSize: 11, color: th.faint }}>How income flows through expenses into cash</p>
              {income > 0 || expense > 0 ? <div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={wfd} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={th.border} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: th.muted, fontSize: 10 }} axisLine={{ stroke: th.border }} interval={0} angle={-25} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: th.muted, fontSize: 10 }} axisLine={{ stroke: th.border }} tickFormatter={function(v) { return sym + (v/1000).toFixed(0) + "k"; }} domain={[0, maxV]} width={50} />
                    <Tooltip content={function(p) { return <CustomWFTooltip active={p.active} payload={p.payload} sym={sym} />; }} />
                    <Bar dataKey="end" shape={function(props) {
                      var d = wfd[props.index], bg = props.background;
                      if (!bg) return <g />;
                      var bgH = bg.height || 200, h = Math.abs((d.end - d.start) / maxV * bgH), barY = bg.y + bgH - (d.end / maxV) * bgH;
                      return <g><rect x={props.x} y={barY} width={props.width} height={Math.max(h, 2)} fill={d.fill} rx={4} opacity={0.9} />{props.index > 0 && props.index < wfd.length - 1 && <line x1={props.x} x2={props.x + props.width + 8} y1={barY} y2={barY} stroke={d.fill} strokeWidth={1.5} strokeDasharray="3 2" opacity={0.5} />}</g>;
                    }}>{wfd.map(function(d, i) { return <Cell key={i} fill={d.fill} />; })}</Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 4 }}>{[["Income","#10b981"],["Expenses","#ef4444"],["Cash","#6366f1"]].map(function(it) { return <span key={it[0]} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, color: th.muted }}><span style={{ width: 9, height: 9, borderRadius: 2, background: it[1], display: "inline-block" }}></span>{it[0]}</span>; })}</div>
              </div> : <p style={{ color: th.faint, fontSize: 13, textAlign: "center", padding: "3rem 0" }}>No data for this period</p>}
            </div>
          </div>
        )}

        {tab === "Transactions" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: th.text }}>Transactions</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: th.surface, border: "1px solid " + th.border, borderRadius: 10, padding: "5px 8px" }}>
                  <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, padding: "0 2px" }}>‹</button>
                  <select value={selMonth} onChange={function(e) { setSelMonth(Number(e.target.value)); setDrillCat(null); }} style={{ background: "transparent", border: "none", color: th.text, fontSize: 13, fontWeight: 600, cursor: "pointer", outline: "none" }}>
                    {MONTHS.map(function(m, i) { return <option key={m} value={i} style={{ background: th.surface, color: th.text }}>{m.slice(0,3)}</option>; })}
                  </select>
                  <select value={selYear} onChange={function(e) { setSelYear(Number(e.target.value)); setDrillCat(null); }} style={{ background: "transparent", border: "none", color: darkMode ? "#a5b4fc" : "#6366f1", fontSize: 13, fontWeight: 600, cursor: "pointer", outline: "none" }}>
                    {yearOptions.map(function(y) { return <option key={y} value={y} style={{ background: th.surface, color: th.text }}>{y}</option>; })}
                  </select>
                  <button onClick={nextMonth} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, padding: "0 2px" }}>›</button>
                </div>
              </div>
              <button onClick={function() { setShowAddModal(true); setEditTxn(null); }} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add</button>
            </div>
            <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, overflowX: "auto" }}>
              {monthTxns.length === 0 ? <p style={{ color: th.faint, textAlign: "center", padding: "3rem" }}>No transactions for {MONTHS[selMonth]} {selYear}.</p> :
                <table className="otx" style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
                  <thead><tr style={{ borderBottom: "1px solid " + th.border }}>{["Date","Description","Category","Account","Type","Amount",""].map(function(h) { return <th key={h} style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, color: th.faint, fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>; })}</tr></thead>
                  <tbody>{monthTxns.slice().sort(function(a,b) { return new Date(b.date) - new Date(a.date); }).map(function(t) {
                    var acct = accounts.find(function(a) { return a.id === t.accountId; });
                    var acctColor = acct ? (ACCT_COLORS[acct.type] || "#888") : "#475569";
                    return <tr key={t.id} style={{ borderBottom: "1px solid " + th.border, background: th.surface }}>
                      <td style={{ padding: "8px", fontSize: 12, color: th.muted, whiteSpace: "nowrap" }}>{t.date}</td>
                      <td style={{ padding: "8px", fontSize: 12, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: th.text }}>{t.description}</td>
                      <td style={{ padding: "8px", fontSize: 12 }}><span style={{ background: th.surface2, borderRadius: 6, padding: "2px 6px", fontSize: 11, whiteSpace: "nowrap" }}>{t.category || "—"}{t.subcategory ? " › " + t.subcategory : ""}</span></td>
                      <td style={{ padding: "8px", fontSize: 12 }}>{acct ? <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: acctColor + "22", color: acctColor, whiteSpace: "nowrap" }}>{acct.name}</span> : <span style={{ color: "#475569" }}>—</span>}</td>
                      <td style={{ padding: "8px" }}><span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: t.type === "income" ? (darkMode ? "#052e16" : "#dcfce7") : (darkMode ? "#450a0a" : "#fee2e2"), color: t.type === "income" ? (darkMode ? "#4ade80" : "#16a34a") : (darkMode ? "#f87171" : "#dc2626"), whiteSpace: "nowrap" }}>{t.type}</span></td>
                      <td style={{ padding: "8px", fontSize: 12, fontWeight: 600, color: t.type === "income" ? "#4ade80" : "#f87171", whiteSpace: "nowrap" }}>{t.type === "expense" ? "-" : ""}{fmt(t.amount, sym)}</td>
                      <td style={{ padding: "8px" }}><div style={{ display: "flex", gap: 4 }}>
                        <button onClick={function() { setEditTxn(t); }} style={{ fontSize: 10, padding: "3px 7px", borderRadius: 6, border: "1px solid #2d2d3d", background: "none", color: "#94a3b8", cursor: "pointer" }}>Edit</button>
                        <button onClick={function() { deleteTxn(t.id); }} style={{ fontSize: 10, padding: "3px 7px", borderRadius: 6, border: "1px solid #450a0a", background: "none", color: "#f87171", cursor: "pointer" }}>Del</button>
                      </div></td>
                    </tr>;
                  })}</tbody>
                </table>}
            </div>
          </div>
        )}

        {tab === "Upload" && (
          <div>
            <h2 style={{ margin: "0 0 1rem", fontSize: 18, fontWeight: 700, color: th.text }}>Upload Statement</h2>
            <div style={{ background: th.surface, border: "2px dashed " + th.border, borderRadius: 12, padding: "2rem 1rem", textAlign: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
              <p style={{ color: th.muted, margin: "0 0 4px", fontSize: 14 }}>Upload your bank or card statement</p>
              <p style={{ color: "#10b981", margin: "0 0 4px", fontSize: 12 }}>✓ HDFC Bank (CSV & Text) · HDFC Credit Card · Indian Bank · Axis Bank parsed locally · ✓ Generic CSV/Excel auto-detection</p>
              <p style={{ color: th.faint, margin: "0 0 14px", fontSize: 12 }}>CSV, TXT supported — no data sent to any server</p>
              <input ref={fileRef} type="file" accept=".csv,.txt,.pdf,.xls,.xlsx" style={{ display: "none" }} onChange={function(e) { if (e.target.files[0]) { setParseError(""); setParseDebug(""); parseStatement(e.target.files[0]); } }} />
              <button onClick={function() { fileRef.current.click(); }} disabled={parsing} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: parsing ? "#3730a3" : "#6366f1", color: "#fff", cursor: parsing ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
                {parsing ? "⏳ Parsing..." : "Choose File"}
              </button>
              {parseError === "password_required" && (
                <div style={{ marginTop: 14, background: "#1e1e2e", border: "1px solid #facc15", borderRadius: 10, padding: "1rem", maxWidth: 320, margin: "14px auto 0" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 13, color: "#facc15" }}>🔒 Password-protected PDF</p>
                  <input type="password" placeholder="Enter PDF password" value={pdfPassword} onChange={function(e) { setPdfPassword(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter" && pendingFile) parseStatement(pendingFile, pdfPassword); }} style={{ width: "100%", background: "#0f0f13", border: "1px solid #2d2d3d", color: "#e2e8f0", padding: "8px 10px", borderRadius: 8, fontSize: 13, boxSizing: "border-box", marginBottom: 8 }} />
                  <button onClick={function() { if (pendingFile) parseStatement(pendingFile, pdfPassword); }} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Unlock & Parse</button>
                </div>
              )}
              {parseError && parseError !== "password_required" && (
                <div style={{ marginTop: 10, textAlign: "left", maxWidth: 480, margin: "10px auto 0" }}>
                  <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 4px" }}>{parseError}</p>
                  {parseDebug && <details style={{ fontSize: 11, color: "#64748b" }}><summary style={{ cursor: "pointer" }}>Debug info</summary><pre style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{parseDebug}</pre></details>}
                </div>
              )}
            </div>

            {showCyclePicker && (
              <div style={{ background: th.surface, border: "1px solid #6366f1", borderRadius: 14, padding: "1.25rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>📅</span>
                  <div><h3 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#6366f1" }}>Yearly statement detected</h3>
                  <p style={{ margin: 0, fontSize: 12, color: th.faint }}>{allParsedTxns.length} transactions found. Select the cycle to load.</p></div>
                </div>
                {(function() {
                  var avail = {};
                  allParsedTxns.forEach(function(t) { var d = new Date(t.date); if (!isNaN(d.getTime())) { var k = d.getFullYear() + "-" + d.getMonth(); if (!avail[k]) avail[k] = { month: d.getMonth(), year: d.getFullYear(), count: 0 }; avail[k].count++; } });
                  var sorted = Object.values(avail).sort(function(a,b) { return b.year !== a.year ? b.year-a.year : b.month-a.month; });
                  return <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "12px 0" }}>{sorted.map(function(item) {
                    var sel = cyclePickerMonth === item.month && cyclePickerYear === item.year;
                    return <button key={item.year+"-"+item.month} onClick={function() { setCyclePickerMonth(item.month); setCyclePickerYear(item.year); }} style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid "+(sel?"#6366f1":"#2d2d3d"), background: sel?"#312e81":th.input, color: sel?"#c7d2fe":th.muted, cursor: "pointer", fontSize: 12, fontWeight: sel?700:400, textAlign: "center" }}>
                      {MONTHS[item.month].slice(0,3)} {item.year}<span style={{ display: "block", fontSize: 10, color: sel?"#a5b4fc":"#475569" }}>{item.count} txns</span>
                    </button>;
                  })}</div>;
                })()}
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "1px solid #2d2d3d", flexWrap: "wrap" }}>
                  <p style={{ margin: 0, fontSize: 12, color: th.faint, flex: 1 }}>Cycle day {cycleStart}-{cycleEnd} · {filterToCycle(allParsedTxns, cyclePickerMonth, cyclePickerYear).length} in range</p>
                  <button onClick={function() { setShowCyclePicker(false); setAllParsedTxns([]); }} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #2d2d3d", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Cancel</button>
                  <button onClick={function() { applyMonthFilter(cyclePickerMonth, cyclePickerYear); }} style={{ padding: "6px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Load cycle →</button>
                </div>
              </div>
            )}

            {parsedTxns.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600, color: th.text }}>{parsedTxns.length} transactions parsed</h3>
                    <p style={{ margin: 0, fontSize: 12, color: th.faint }}>
                      <span style={{ color: "#4ade80" }}>✓ {autoCatCount} auto-categorized</span>
                      {uncatCount > 0 && <span style={{ color: "#facc15", marginLeft: 8 }}>⚠ {uncatCount} need attention</span>}
                    </p>
                  </div>
                  <button onClick={confirmParsed} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>Confirm All →</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {parsedTxns.slice().sort(function(a,b) { var aL=!a.category||a.autocat==="low", bL=!b.category||b.autocat==="low"; return aL===bL?0:aL?-1:1; }).map(function(t) {
                    var needsAttn = !t.category || t.autocat === "low";
                    var origIdx = parsedTxns.findIndex(function(p) { return p.id === t.id; });
                    function upd(k, v) { setParsedTxns(function(prev) { return prev.map(function(p, j) { return j === origIdx ? Object.assign({}, p, { [k]: v }) : p; }); }); }
                    return <div key={t.id} style={{ background: th.surface, border: "1px solid "+(needsAttn?"#854d0e":"#14532d"), borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: needsAttn?(darkMode?"#451a03":"#fff7ed"):(darkMode?"#052e16":"#f0fdf4"), color: needsAttn?(darkMode?"#facc15":"#d97706"):(darkMode?"#4ade80":"#16a34a") }}>{needsAttn?"⚠ Manual":"✓ Auto"}</span>
                        {t.originalDate && <span style={{ fontSize: 10, color: "#f59e0b" }}>reflected from {t.originalDate}</span>}
                        <span style={{ fontSize: 12, fontWeight: 600, color: t.type==="income"?"#4ade80":"#f87171", marginLeft: "auto" }}>{t.type==="expense"?"-":""}{fmt(t.amount, sym)}</span>
                        <button onClick={function() { setParsedTxns(function(prev) { return prev.filter(function(p) { return p.id !== t.id; }); }); }} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, border: "1px solid #450a0a", background: "none", color: "#f87171", cursor: "pointer" }}>✕</button>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                        <input type="date" value={t.date} onChange={function(e) { upd("date", e.target.value); }} style={{ background: th.input, border: "1px solid " + th.border, color: th.muted, padding: "3px 6px", borderRadius: 6, fontSize: 11 }} />
                        <input type="number" value={t.amount} min="0" step="0.01" onChange={function(e) { upd("amount", parseFloat(e.target.value)||0); }} style={{ background: th.input, border: "1px solid " + th.border, color: t.type==="income"?(darkMode?"#4ade80":"#16a34a"):(darkMode?"#f87171":"#dc2626"), padding: "3px 6px", borderRadius: 6, fontSize: 11, width: 90 }} />
                        <span style={{ fontSize: 12, flex: 1, minWidth: 80, color: th.text, wordBreak: "break-word", overflowWrap: "anywhere" }}>{t.description}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <select value={t.category} onChange={function(e) {
                            var newCat = e.target.value;
                            upd("category", newCat);
                            upd("subcategory", "");
                            upd("autocat", "low");
                          }} style={{ flex: 1, minWidth: 120, background: needsAttn?(darkMode?"#1c1008":"#fff7ed"):(darkMode?"#0a1a0f":"#f0fdf4"), border: "1px solid "+(needsAttn?"#854d0e":"#14532d"), color: th.text, padding: "4px 6px", borderRadius: 6, fontSize: 12 }}>
                          <option value="">Category...</option>
                          {Object.keys(categories).filter(function(c) { return t.type==="income"?c==="Income":c!=="Income"; }).map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                        </select>
                        <select value={t.subcategory||""} onChange={function(e) { upd("subcategory", e.target.value); upd("autocat", "high"); }} disabled={!t.category} style={{ flex: 1, minWidth: 100, background: t.category?(needsAttn?(darkMode?"#1c1008":"#fff7ed"):(darkMode?"#0a1a0f":"#f0fdf4")):th.input, border: "1px solid "+(needsAttn?"#854d0e":"#14532d"), color: t.category?th.text:th.faint, padding: "4px 6px", borderRadius: 6, fontSize: 12, opacity: t.category?1:0.45, cursor: t.category?"pointer":"not-allowed" }}>
                          <option value="">Subcategory...</option>
                          {(categories[t.category]||[]).map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                        </select>
                      </div>
                    </div>;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "Categories" && (
          <div>
            <h2 style={{ margin: "0 0 1rem", fontSize: 18, fontWeight: 700, color: th.text }}>Manage Categories</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
              {Object.keys(categories).map(function(cat) {
                var subs = categories[cat];
                return <div key={cat} style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6366f1" }}>{cat}</h3>
                    <button onClick={function() { setCategories(function(prev) { var n=Object.assign({},prev); delete n[cat]; return n; }); }} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, border: "1px solid #450a0a", background: "none", color: "#f87171", cursor: "pointer" }}>Remove</button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>{subs.map(function(s) { return <span key={s} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: th.surface2, color: th.muted, display: "flex", alignItems: "center", gap: 3 }}>{s}<span style={{ cursor: "pointer", color: "#475569" }} onClick={function() { setCategories(function(prev) { return Object.assign({},prev,{[cat]:prev[cat].filter(function(x){return x!==s;})}); }); }}>×</span></span>; })}</div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <input placeholder="Add subcategory" value={newSub[cat]||""} onChange={function(e) { var v=e.target.value; setNewSub(function(p){return Object.assign({},p,{[cat]:v});}); }} onKeyDown={function(e) { if(e.key==="Enter"&&newSub[cat]&&newSub[cat].trim()){var v=newSub[cat].trim();setCategories(function(p){return Object.assign({},p,{[cat]:p[cat].concat([v])});});setNewSub(function(p){return Object.assign({},p,{[cat]:""});});} }} style={{ flex: 1, background: th.input, border: "1px solid " + th.border, color: th.text, padding: "4px 8px", borderRadius: 6, fontSize: 12 }} />
                    <button onClick={function() { if(newSub[cat]&&newSub[cat].trim()){var v=newSub[cat].trim();setCategories(function(p){return Object.assign({},p,{[cat]:p[cat].concat([v])});});setNewSub(function(p){return Object.assign({},p,{[cat]:""});});} }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 12 }}>+</button>
                  </div>
                </div>;
              })}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input placeholder="New category name" value={newCat} onChange={function(e){setNewCat(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&newCat.trim()&&!categories[newCat]){var v=newCat.trim();setCategories(function(p){return Object.assign({},p,{[v]:[]});});setNewCat("");}}} style={{ background: th.input, border: "1px solid " + th.border, color: th.text, padding: "8px 12px", borderRadius: 8, fontSize: 13, flex: 1, minWidth: 180 }} />
              <button onClick={function(){if(newCat.trim()&&!categories[newCat]){var v=newCat.trim();setCategories(function(p){return Object.assign({},p,{[v]:[]});});setNewCat("");}}} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Add Category</button>
            </div>
            <h2 style={{ margin: "1.5rem 0 1rem", fontSize: 18, fontWeight: 700 }}>Manage Accounts</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10, marginBottom: 12 }}>
              {accounts.map(function(a) {
                var c = ACCT_COLORS[a.type] || "#888";
                return <div key={a.id} style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontWeight: 600, fontSize: 13, color: th.text }}>{a.name}</div><div style={{ fontSize: 11, marginTop: 3, color: c }}>{a.type}</div></div>
                  <button onClick={function() { setAccounts(function(prev) { return prev.filter(function(x) { return x.id !== a.id; }); }); }} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, border: "1px solid #450a0a", background: "none", color: "#f87171", cursor: "pointer" }}>Remove</button>
                </div>;
              })}
            </div>
            <AddAccountInline onAdd={function(a) { setAccounts(function(p) { return p.concat([a]); }); }} th={th} />
          </div>
        )}

        {tab === "Settings" && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ margin: "0 0 1rem", fontSize: 18, fontWeight: 700, color: th.text }}>Settings</h2>
            <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 16 }}>
              <div><label style={{ display: "block", fontSize: 12, color: th.faint, marginBottom: 5 }}>Default Currency</label>
                <select value={currency.code} onChange={function(e){var c=CURRENCIES.find(function(x){return x.code===e.target.value;});if(c)setCurrency(c);}} style={is}>{CURRENCIES.map(function(c){return <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>;})}</select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={{ display: "block", fontSize: 12, color: th.faint, marginBottom: 5 }}>Cycle Start Day</label><input type="number" min={1} max={28} value={cycleStart} onChange={function(e){setCycleStart(Number(e.target.value));}} style={is} /></div>
                <div><label style={{ display: "block", fontSize: 12, color: th.faint, marginBottom: 5 }}>Cycle End Day</label><input type="number" min={1} max={31} value={cycleEnd} onChange={function(e){setCycleEnd(Number(e.target.value));}} style={is} /></div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: th.faint, marginBottom: 8 }}>Carry Forward Net Savings</label>
                <div onClick={function() { setCarryForward(function(p) { return !p; }); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: th.surface2, border: "1px solid " + th.border, borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500, color: th.text }}>Show Opening & Closing Balance</p>
                    <p style={{ margin: 0, fontSize: 11, color: th.faint }}>Tracks cumulative net savings across months so you can match your actual bank balance</p>
                  </div>
                  <div style={{ marginLeft: 12, flexShrink: 0, width: 44, height: 24, borderRadius: 12, background: carryForward ? "#6366f1" : th.border, position: "relative", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 3, left: carryForward ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}></div>
                  </div>
                </div>
              </div>
              <div><label style={{ display: "block", fontSize: 12, color: th.faint, marginBottom: 5 }}>Export Statement Data</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={function(){exportData("csv");}} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid " + th.border, background: th.input, color: "#6366f1", cursor: "pointer", fontSize: 13 }}>↓ CSV</button>
                  <button onClick={function(){exportData("txt");}} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid " + th.border, background: th.input, color: "#6366f1", cursor: "pointer", fontSize: 13 }}>↓ Report</button>
                </div>
              </div>
              <div style={{ borderTop: "1px solid " + th.border, paddingTop: 16 }}>
                <label style={{ display: "block", fontSize: 12, color: th.faint, marginBottom: 4 }}>Backup & Restore</label>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: th.faint }}>Saved in your browser's localStorage. Use backup to transfer across devices.</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <button onClick={exportJSON} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #14532d", background: darkMode ? "#052e16" : "#f0fdf4", color: darkMode ? "#4ade80" : "#16a34a", cursor: "pointer", fontSize: 13 }}>↓ Download Backup</button>
                  <button onClick={function(){importRef.current.click();}} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1px solid #1e3a5f", background: darkMode ? "#0c1e35" : "#eff6ff", color: "#3b82f6", cursor: "pointer", fontSize: 13 }}>↑ Restore Backup</button>
                </div>
                <input ref={importRef} type="file" accept=".json" style={{ display: "none" }} onChange={function(e){if(e.target.files[0])importJSON(e.target.files[0]);}} />
                <div style={{ background: th.surface2, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: th.faint, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#4ade80" }}>●</span> {transactions.length} transactions · {Object.keys(categories).length} categories · {accounts.length} accounts
                </div>
              </div>
              <div style={{ borderTop: "1px solid " + th.border, paddingTop: 16 }}>
                <label style={{ display: "block", fontSize: 12, color: th.faint, marginBottom: 8 }}>Danger Zone</label>
                {!confirmClear ? <button onClick={function(){setConfirmClear(true);}} style={{ width: "100%", padding: "9px", borderRadius: 8, border: "1px solid #450a0a", background: darkMode ? "#0f0f13" : "#fff5f5", color: "#f87171", cursor: "pointer", fontSize: 13 }}>🗑 Clear all data</button> :
                  <div style={{ background: "#1c0a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "12px" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 13, color: "#fca5a5" }}>Are you sure? This will permanently delete all transactions and categories.</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={function(){setConfirmClear(false);}} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #2d2d3d", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                      <button onClick={clearAllData} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Yes, clear everything</button>
                    </div>
                  </div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {(showAddModal || editTxn) && <TxnModal txn={editTxn} categories={categories} accounts={accounts} sym={sym} th={th} onSave={saveTxn} onClose={function(){setShowAddModal(false);setEditTxn(null);}} />}
      {showAccountPicker && <AccountPickerModal accounts={accounts} onAddAccount={function(a) { setAccounts(function(p) { return p.concat([a]); }); }} onConfirm={onAccountConfirmed} onCancel={function() { setShowAccountPicker(false); setPendingParsedTxns([]); }} />}
      {showCCDateModal && <CCDateModal onConfirm={onCCDateConfirmed} />}
    </div>
  );
}

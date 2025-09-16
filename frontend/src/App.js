import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [fixedSalaryEmployees] = useState([
    { name: 'Raidel Reyes Dorado', role: 'Manager', salary: 1100, daily: 183.33 },
    { name: 'Rigo', role: 'Chef', salary: 1200, daily: 200.00 },
    { name: 'Juan Velazquez', role: 'Bartender', salary: 800, daily: 133.33 }
  ]);
  const [uploadedCSVs, setUploadedCSVs] = useState([]); // siempre empieza como []
  const [selectedCSV, setSelectedCSV] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [analysisData, setAnalysisData] = useState(null);
  const [incomeData, setIncomeData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDaysForAnalysis, setSelectedDaysForAnalysis] = useState([]);
  
  // --- TAREA 2: Modificación de estado para análisis de empleados ---
  // Se cambia de string a array para almacenar múltiples empleados.
  const [selectedEmployeesForAnalysis, setSelectedEmployeesForAnalysis] = useState([]);
  
  // --- TAREA 1: Listas para datalist ---
  const POSITIONS_LIST = ['Server', 'Bartender', 'Host', 'Busser', 'Runner', 'Cook', 'Pastry'];
  const EMPLOYEES_LIST = [
    'Germán González', 'Juan Velázquez', 'Arnaldo Sánchez', 'Maris Sánchez',
    'Sandy Tapanes', 'Kamila Navarro', 'Luvian Silva', 'Richard De Armas',
    'Diana Rodríguez', 'Yudisleidy Figueredo', 'Osmany Piquero', 'Ángel García',
    'Yiselys Azcuy', 'Arlettys González'
  ];

  // URL del backend
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:4000';

  // Flags para evitar guardar en el primer render
  const firstSaveIncome = useRef(true);
  const firstSaveTips = useRef(true);
  const firstSaveCSVs = useRef(true);

  // Estado para Tips Pool
  const [tipsPoolData, setTipsPoolData] = useState({});

  // Tarifas por hora
  const hourlyRates = {
    Server: 9.99,
    Bartender: 12.00,
    Host: 12.00,
    Busser: 12.00,
    Runner: 12.00,
    Cook: 16.00,
    Pastry: 15.00
  };

  // === Cargar datos del backend al iniciar la app ===
  useEffect(() => {
    const loadData = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/data`);
        const data = await resp.json();

        if (data.incomeData) setIncomeData(data.incomeData);
        if (data.tipsPoolData) setTipsPoolData(data.tipsPoolData);
        if (Array.isArray(data.uploadedCSVs)) {
          setUploadedCSVs(data.uploadedCSVs);
        } else {
          setUploadedCSVs([]);
        }

        console.log("✅ Datos iniciales cargados desde backend.");
      } catch (err) {
        console.error("❌ No se pudieron cargar datos del backend:", err+"from"+API_BASE+"/api/data");
      }
    };
    loadData();
  }, [API_BASE]);

  // === Guardar incomeData automáticamente ===
  useEffect(() => {
    if (firstSaveIncome.current) {
      firstSaveIncome.current = false;
      return;
    }
    const save = async () => {
      try {
        await fetch(`${API_BASE}/api/data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "incomeData", value: incomeData }),
        });
        console.log("💾 incomeData guardado en backend");
      } catch (err) {
        console.error("Error guardando incomeData:", err);
      }
    };
    if (incomeData && Object.keys(incomeData).length > 0) save();
  }, [incomeData, API_BASE]);

  // === Guardar tipsPoolData automáticamente ===
  useEffect(() => {
    if (firstSaveTips.current) {
      firstSaveTips.current = false;
      return;
    }
    const save = async () => {
      try {
        await fetch(`${API_BASE}/api/data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "tipsPoolData", value: tipsPoolData }),
        });
        console.log("💾 tipsPoolData guardado en backend");
      } catch (err) {
        console.error("Error guardando tipsPoolData:", err);
      }
    };
    if (tipsPoolData && Object.keys(tipsPoolData).length > 0) save();
  }, [tipsPoolData, API_BASE]);

  // === Guardar uploadedCSVs automáticamente (para Verificar Salarios) ===
  useEffect(() => {
    if (firstSaveCSVs.current) {
      firstSaveCSVs.current = false;
      return;
    }
    const save = async () => {
      try {
        await fetch(`${API_BASE}/api/data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "uploadedCSVs", value: uploadedCSVs }),
        });
        console.log("💾 uploadedCSVs guardados en backend");
      } catch (err) {
        console.error("Error guardando uploadedCSVs:", err);
      }
    };
    if (Array.isArray(uploadedCSVs)) {
      save();
    } else {
      console.warn("⚠️ uploadedCSVs no es un array válido:", uploadedCSVs);
    }
  }, [uploadedCSVs, API_BASE]);


  // Función para obtener fecha de NYC (Eastern Time)
  const getNYCDate = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const nycTime = new Date(utc + (-5 * 3600000)); // EST (UTC-5)
    return nycTime.toISOString().split('T')[0];
  };
  // Función para convertir horas decimales a formato HH:mm
  const decimalToHHmm = (decimalHours) => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };
  // Función para sumar tiempos en formato HH:mm
  const sumHHmmTimes = (times) => {
    let totalMinutes = 0;
    times.forEach(time => {
      const [hours, minutes] = time.split(':').map(Number);
      totalMinutes += hours * 60 + minutes;
    });
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
  };
  // Función para preparar datos de análisis
  const prepareAnalysisData = (csvData) => {
    // Agrupar por empleado
    const employeeData = csvData.reduce((acc, shift) => {
      const key = shift.fullName;
      if (!acc[key]) {
        acc[key] = {
          name: shift.fullName,
          totalHours: 0,
          totalPay: 0,
          jobTitle: shift.jobTitle,
          shifts: []
        };
      }
      acc[key].shifts.push(shift);
      acc[key].totalHours += shift.hoursOriginal;
      acc[key].totalPay += shift.pay;
      return acc;
    }, {});
    // Agrupar por puesto
    const positionData = csvData.reduce((acc, shift) => {
      const key = shift.jobTitle;
      if (!acc[key]) {
        acc[key] = {
          name: shift.jobTitle,
          totalHours: 0,
          totalPay: 0,
          employeeCount: 0,
          employees: new Set()
        };
      }
      acc[key].totalHours += shift.hoursOriginal;
      acc[key].totalPay += shift.pay;
      acc[key].employees.add(shift.fullName);
      return acc;
    }, {});
    // Convertir Set a count
    Object.keys(positionData).forEach(key => {
      positionData[key].employeeCount = positionData[key].employees.size;
      delete positionData[key].employees;
    });
    // Datos para tablas
    const employeeChartData = Object.values(employeeData).map(emp => ({
      name: emp.name.length > 20 ? emp.name.substring(0, 20) + '...' : emp.name,
      horas: parseFloat(emp.totalHours.toFixed(2)),
      pago: parseFloat(emp.totalPay.toFixed(2))
    }));
    const positionChartData = Object.values(positionData).map(pos => ({
      name: pos.name,
      horas: parseFloat(pos.totalHours.toFixed(2)),
      pago: parseFloat(pos.totalPay.toFixed(2)),
      empleados: pos.employeeCount
    }));
    // Totales generales
    const totalHours = csvData.reduce((sum, shift) => sum + shift.hoursOriginal, 0);
    const totalPay = csvData.reduce((sum, shift) => sum + shift.pay, 0);
    const uniqueEmployees = new Set(csvData.map(shift => shift.fullName)).size;
    return {
      employeeData: Object.values(employeeData),
      positionData: Object.values(positionData),
      employeeChartData,
      positionChartData,
      totals: {
        totalHours: parseFloat(totalHours.toFixed(2)),
        totalPay: parseFloat(totalPay.toFixed(2)),
        uniqueEmployees,
        averageHoursPerEmployee: parseFloat((totalHours / uniqueEmployees).toFixed(2)),
        averagePayPerEmployee: parseFloat((totalPay / uniqueEmployees).toFixed(2))
      }
    };
  };
  // Función para manejar carga de CSV (USAR FECHA DE NYC)
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = text.split('\n').slice(1).filter(row => row.trim() !== '');
      const processedData = [];
      rows.forEach(row => {
        const cleanRow = row.trim();
        if (!cleanRow) return;
        // Split que respeta comillas
        const cols = cleanRow
          .replace(/\r/g, '')
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map(col => col.replace(/^"(.*)"$/, '$1').trim());
        if (cols.length < 9) return;
        const [
          location,
          fullName,
          jobTitle,
          inDate,
          outDate,
          totalHours,
          unpaidBreak,
          paidBreak,
          payableHours
        ] = cols;
        const cleanName = fullName?.trim() || '';
        if (!cleanName || !jobTitle || !inDate) return;
        // Ignorar empleados fijos
        const isFixed = fixedSalaryEmployees.some(emp => 
          cleanName.toLowerCase().includes(emp.name.toLowerCase().split(' ')[0]) || 
          cleanName.toLowerCase().includes(emp.name.toLowerCase().split(' ')[1])
        );
        if (isFixed) return;
        // ✅ PROCESAMIENTO CORRECTO: Usar horas decimales del CSV para cálculos para que sea legal
        const decimalHours = parseFloat(payableHours) || 0;
        const hoursFormatted = decimalToHHmm(decimalHours); // Solo para visualización no hacer porqe da menos dinero
        // ✅ CALCULAR PAGO CON HORAS DECIMALES ORIGINALES
        const rate = hourlyRates[jobTitle] || 9.99;
        const pay = parseFloat((decimalHours * rate).toFixed(2));
        processedData.push({
          fullName: cleanName,
          jobTitle,
          inDate,
          outDate,
          hoursOriginal: decimalHours,
          hoursFormatted: hoursFormatted,
          rate,
          pay
        });
      });
      // Guardar en estado - USAR FECHA DE NYC
      const uploadDate = getNYCDate();
      const newCSV = {
        id: Date.now(),
        fileName: file.name,
        uploadDate,
        data: processedData,
        totalPayment: processedData.reduce((sum, shift) => sum + shift.pay, 0)
      };
      setUploadedCSVs(prev => [...prev, newCSV]);
      setCurrentView('salaries');
    };
    reader.readAsText(file);
  };
  // Función para convertir datos a CSV
  const convertToCSV = (data) => {
    const headers = [
      'Nombre Completo',
      'Puesto',
      'Tarifa por Hora',
      'Hora de Entrada',
      'Hora de Salida',
      'Horas (Decimal)',
      'Horas (HH:mm)',
      'Pago'
    ];
    // Agrupar por empleado
    const grouped = data.reduce((acc, shift) => {
      const key = shift.fullName;
      if (!acc[key]) {
        acc[key] = {
          employee: shift,
          shifts: [],
          totalPay: 0,
          totalHoursDecimal: 0,
          totalHoursHHmm: '0:00'
        };
      }
      acc[key].shifts.push(shift);
      acc[key].totalPay += shift.pay;
      acc[key].totalHoursDecimal += shift.hoursOriginal;
      return acc;
    }, {});
    // Procesar cada grupo
    const rows = [];
    Object.values(grouped).forEach(group => {
      // Añadir todas las filas de turnos
      group.shifts.forEach(shift => {
        rows.push([
          `"${shift.fullName}"`,
          `"${shift.jobTitle}"`,
          `$${shift.rate.toFixed(2)}`,
          `"${shift.inDate}"`,
          `"${shift.outDate}"`,
          `${shift.hoursOriginal.toFixed(2)}`,
          `"${shift.hoursFormatted}"`,
          `$${shift.pay.toFixed(2)}`
        ].join(','));
      });
      // Añadir fila de total por empleado
      const totalHHmm = sumHHmmTimes(group.shifts.map(s => s.hoursFormatted));
      rows.push([
        `"Total del Empleado: ${group.employee.fullName}"`,
        '',
        '',
        '',
        '',
        `${group.totalHoursDecimal.toFixed(2)}`,
        `"${totalHHmm}"`,
        `$${group.totalPay.toFixed(2)}`
      ].join(','));
    });
    // Unir encabezados y filas
    return [headers.join(','), ...rows].join('\n');
  };
  // Función para descargar CSV
  const downloadCSV = (data, filename) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // Función para descargar reporte completo
  const downloadReport = (csv) => {
    downloadCSV(csv.data, `reporte_nomina_${csv.uploadDate}`);
  };
  // Función para eliminar CSV
  const deleteCSV = () => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.");
    if (confirmDelete) {
      setUploadedCSVs(prev => prev.filter(csv => csv.id !== selectedCSV.id));
      setSelectedCSV(null);
      setAnalysisData(null);
    }
  };
  // Función para analizar datos
  const analyzeData = () => {
    if (selectedCSV) {
      const analysis = prepareAnalysisData(selectedCSV.data);
      setAnalysisData(analysis);
      setCurrentView('analysis');
    }
  };
  // Función para volver a salarios desde análisis
  const backToSalaries = () => {
    setCurrentView('salaries');
  };
  // Función para abrir CSV
  const openCSV = (csv) => {
    setSelectedCSV(csv);
  };
  // Navegación en el calendario
  const goToPrevMonth = () => {
    setCurrentMonth(prev => (prev === 0 ? 11 : prev - 1));
    setCurrentYear(prev => (currentMonth === 0 ? prev - 1 : prev));
  };
  const goToNextMonth = () => {
    setCurrentMonth(prev => (prev === 11 ? 0 : prev + 1));
    setCurrentYear(prev => (currentMonth === 11 ? prev + 1 : prev));
  };
  // Funciones para manejar datos de ingresos
  const addIncomeRow = (date) => {
    const newRow = {
      id: Date.now(),
      name: '',
      position: '',
      netSales: '',
      tips: '',
      gratuity: '',
      fivePercent: 0,
      tPlusG: 0,
      tPlusGMinusFive: 0,
      // Nuevo campo para controlar si se debe calcular el 5% , esto es para los empleados que no deben de dar comison
      excludeFivePercent: false
    };
    setIncomeData(prev => ({
      ...prev,
      [date]: [...(prev[date] || []), newRow]
    }));
  };
  const updateIncomeRow = (date, rowIndex, field, value) => {
    setIncomeData(prev => {
      const newData = [...(prev[date] || [])];
      const row = { ...newData[rowIndex] };
      // Actualizar campos de nombre y posición
      if (field === 'name' || field === 'position') {
        row[field] = value;
      }
      // Actualizar el campo específico
      if (field === 'netSales' || field === 'tips' || field === 'gratuity') {
        row[field] = value;
      }
      // Calcular campos automáticos basados en el estado de exclusión
      const netSales = parseFloat(row.netSales) || 0;
      const tips = parseFloat(row.tips) || 0;
      const gratuity = parseFloat(row.gratuity) || 0;
      // Solo calcular 5% si no está excluido
      row.fivePercent = row.excludeFivePercent ? 0 : netSales * 0.05;
      row.tPlusG = tips + gratuity;
      row.tPlusGMinusFive = row.tPlusG - row.fivePercent;
      newData[rowIndex] = row;
      return {
        ...prev,
        [date]: newData
      };
    });
  };
  const deleteIncomeRow = (date, rowIndex) => {
    setIncomeData(prev => ({
      ...prev,
      [date]: (prev[date] || []).filter((_, index) => index !== rowIndex)
    }));
  };
  // Función para alternar la exclusión del 5%
  const toggleFivePercentExclusion = (date, rowIndex) => {
    setIncomeData(prev => {
      const newData = [...(prev[date] || [])];
      const row = { ...newData[rowIndex] };
      // Alternar el estado
      row.excludeFivePercent = !row.excludeFivePercent;
      // Recalcular valores basados en el nuevo estado
      const netSales = parseFloat(row.netSales) || 0;
      const tips = parseFloat(row.tips) || 0;
      const gratuity = parseFloat(row.gratuity) || 0;
      row.fivePercent = row.excludeFivePercent ? 0 : netSales * 0.05;
      row.tPlusG = tips + gratuity;
      row.tPlusGMinusFive = row.tPlusG - row.fivePercent;
      newData[rowIndex] = row;
      return {
        ...prev,
        [date]: newData
      };
    });
  };
  const openIncomeDate = (date) => {
    setSelectedDate(date);
    setCurrentView('income-date');
  };
  const saveIncomeData = () => {
    // Los datos ya se guardan automáticamente en el estado
    setCurrentView('income-calendar');
  };
  // Calcular totales para la fecha seleccionada
  const calculateDateTotals = (date) => {
    const data = incomeData[date] || [];
    return data.reduce((totals, row) => {
      totals.netSales += parseFloat(row.netSales) || 0;
      totals.tips += parseFloat(row.tips) || 0;
      totals.gratuity += parseFloat(row.gratuity) || 0;
      totals.fivePercent += row.fivePercent;
      totals.tPlusG += row.tPlusG;
      totals.tPlusGMinusFive += row.tPlusGMinusFive;
      return totals;
    }, {
      netSales: 0,
      tips: 0,
      gratuity: 0,
      fivePercent: 0,
      tPlusG: 0,
      tPlusGMinusFive: 0
    });
  };
  // Funciones para análisis de ingresos
  const toggleDaySelection = (date) => {
    setSelectedDaysForAnalysis(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date);
      } else {
        return [...prev, date];
      }
    });
  };
  const calculateCustomAnalysisTotals = () => {
    return selectedDaysForAnalysis.reduce((totals, date) => {
      const dayTotals = calculateDateTotals(date);
      totals.netSales += dayTotals.netSales;
      totals.tips += dayTotals.tips;
      totals.gratuity += dayTotals.gratuity;
      totals.fivePercent += dayTotals.fivePercent;
      totals.tPlusG += dayTotals.tPlusG;
      totals.tPlusGMinusFive += dayTotals.tPlusGMinusFive;
      return totals;
    }, {
      netSales: 0,
      tips: 0,
      gratuity: 0,
      fivePercent: 0,
      tPlusG: 0,
      tPlusGMinusFive: 0
    });
  };
  // Función para normalizar nombres (eliminar espacios extra y convertir a minúsculas)
  const normalizeName = (name) => {
    return name ? name.trim().toLowerCase() : '';
  };
  // Función para calcular totales por empleado en el periodo
  const calculateEmployeePeriodTotals = (employeeName) => {
    if (!employeeName) return null;
    return selectedDaysForAnalysis.reduce((totals, date) => {
      const dayData = incomeData[date] || [];
      // Filtrar filas que coincidan con el nombre normalizado
      const employeeData = dayData.filter(row => 
        normalizeName(row.name) === employeeName
      );
      employeeData.forEach(row => {
        totals.netSales += parseFloat(row.netSales) || 0;
        totals.tips += parseFloat(row.tips) || 0;
        totals.gratuity += parseFloat(row.gratuity) || 0;
        totals.fivePercent += row.fivePercent;
        totals.tPlusG += row.tPlusG;
        totals.tPlusGMinusFive += row.tPlusGMinusFive;
      });
      return totals;
    }, {
      netSales: 0,
      tips: 0,
      gratuity: 0,
      fivePercent: 0,
      tPlusG: 0,
      tPlusGMinusFive: 0
    });
  };
  const startCustomAnalysis = () => {
    setCurrentView('custom-analysis');
    // Resetear selección de empleado al iniciar nuevo análisis
    setSelectedEmployeesForAnalysis([]);
  };
  // Función para convertir datos del día a CSV
  const convertDayDataToCSV = (date) => {
    const data = incomeData[date] || [];
    if (data.length === 0) return "";
    const headers = [
      'Nombre Completo',
      'Puesto',
      'Net Sales ($)',
      'Tips ($)',
      'Gratuity ($)',
      '5%',
      'T+G',
      'T+G-5%'
    ];
    const rows = data.map(row => [
      `"${row.name || ''}"`,
      `"${row.position || ''}"`,
      `"${parseFloat(row.netSales) || 0}"`,
      `"${parseFloat(row.tips) || 0}"`,
      `"${parseFloat(row.gratuity) || 0}"`,
      `"${row.fivePercent}"`,
      `"${row.tPlusG}"`,
      `"${row.tPlusGMinusFive}"`
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  };
  // Función para descargar datos del día como CSV
  const downloadDayDataCSV = (date) => {
    const csvContent = convertDayDataToCSV(date);
    if (!csvContent) {
      alert("No hay datos para descargar.");
      return;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ingresos_diarios_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Funciones para Tips Pool
  const openTipsPoolDate = (date) => {
    setSelectedDate(date);
    setCurrentView('tips-pool-day');
  };

  const saveTipsPoolData = () => {
    // Los datos ya se guardan automáticamente en el estado
    setCurrentView('tips-pool-calendar');
  };

  const updateTipsPoolRow = (date, rowIndex, field, value) => {
    setTipsPoolData(prev => {
      // Obtener los datos actuales para esta fecha
      const currentData = prev[date] || { total: 0, rows: [] };
      const newData = [...currentData.rows];
      
      // Asegurarse de que exista el objeto row
      if (!newData[rowIndex]) {
        newData[rowIndex] = {
          id: Date.now() + rowIndex,
          position: '',
          percentage: 0,
          personal: 0,
          employeeColumns: []
        };
      }
      
      const row = { ...newData[rowIndex] };
      
      if (field === 'position') {
        row.position = value;
      } else if (field === 'percentage') {
        row.percentage = parseFloat(value) || 0;
      } else if (field === 'personal') {
        const personalCount = parseInt(value) || 0;
        row.personal = personalCount;
        
        // Ajustar el número de columnas de empleados
        const currentEmployeeColumns = row.employeeColumns || [];
        if (personalCount > currentEmployeeColumns.length) {
          // Agregar nuevas columnas
          const newColumns = Array(personalCount - currentEmployeeColumns.length).fill().map((_, i) => ({
            id: Date.now() + i,
            name: '',
            hours: 0,
            tips: 0
          }));
          row.employeeColumns = [...currentEmployeeColumns, ...newColumns];
        } else if (personalCount < currentEmployeeColumns.length) {
          // Reducir columnas
          row.employeeColumns = currentEmployeeColumns.slice(0, personalCount);
        }
      } else if (field.startsWith('employeeName_')) {
        const index = parseInt(field.split('_')[1]);
        if (row.employeeColumns && row.employeeColumns[index]) {
          row.employeeColumns[index].name = value;
        }
      } else if (field.startsWith('employeeHours_')) {
        const index = parseInt(field.split('_')[1]);
        if (row.employeeColumns && row.employeeColumns[index]) {
          const hours = parseFloat(value) || 0;
          row.employeeColumns[index].hours = hours;
        }
      }
      
      // Recalcular propinas para todos los empleados en la fila
      const totalTipsPool = parseFloat(currentData.total) || 0;
      const rowPercentage = parseFloat(row.percentage) || 0;
      const totalTipsForPosition = totalTipsPool * (rowPercentage / 100);
      const totalHoursForPosition = row.employeeColumns?.reduce((sum, emp) => sum + (parseFloat(emp.hours) || 0), 0) || 0;
      
      if (row.employeeColumns && totalHoursForPosition > 0) {
        row.employeeColumns = row.employeeColumns.map(emp => {
          const empHours = parseFloat(emp.hours) || 0;
          return {
            ...emp,
            tips: (totalTipsForPosition * empHours) / totalHoursForPosition
          };
        });
      } else if (row.employeeColumns) {
        // Si no hay horas totales, poner 0 a todos
        row.employeeColumns = row.employeeColumns.map(emp => ({
          ...emp,
          tips: 0
        }));
      }
      
      newData[rowIndex] = row;
      
      // Recalcular totales para todas las filas
      const updatedRows = newData.map(r => {
        if (r === row) return row; // Ya calculado
        const rRowPercentage = parseFloat(r.percentage) || 0;
        const rTotalTipsForPosition = totalTipsPool * (rRowPercentage / 100);
        const rTotalHoursForPosition = r.employeeColumns?.reduce((sum, emp) => sum + (parseFloat(emp.hours) || 0), 0) || 0;
        
        if (r.employeeColumns && rTotalHoursForPosition > 0) {
          return {
            ...r,
            employeeColumns: r.employeeColumns.map(emp => {
              const empHours = parseFloat(emp.hours) || 0;
              return {
                ...emp,
                tips: (rTotalTipsForPosition * empHours) / rTotalHoursForPosition
              };
            })
          };
        } else if (r.employeeColumns) {
          return {
            ...r,
            employeeColumns: r.employeeColumns.map(emp => ({
              ...emp,
              tips: 0
            }))
          };
        }
        return r;
      });
      
      return {
        ...prev,
        [date]: {
          total: currentData.total,
          rows: updatedRows
        }
      };
    });
  };

  const addTipsPoolRow = (date) => {
    setTipsPoolData(prev => {
      const currentData = prev[date] || { total: 0, rows: [] };
      const newRow = {
        id: Date.now(),
        position: '',
        percentage: 0,
        personal: 0,
        employeeColumns: []
      };
      return {
        ...prev,
        [date]: {
          total: currentData.total,
          rows: [...currentData.rows, newRow]
        }
      };
    });
  };

  const deleteTipsPoolRow = (date, rowIndex) => {
    setTipsPoolData(prev => {
      const currentData = prev[date] || { total: 0, rows: [] };
      const newData = currentData.rows.filter((_, index) => index !== rowIndex);
      return {
        ...prev,
        [date]: {
          total: currentData.total,
          rows: newData
        }
      };
    });
  };

  const calculatePercentageSum = (date) => {
    const data = tipsPoolData[date] || { total: 0, rows: [] };
    return data.rows.reduce((sum, row) => sum + (parseFloat(row.percentage) || 0), 0);
  };
  
  const convertTipsPoolToCSV = (date) => {
    const data = tipsPoolData[date];
    if (!data || !data.rows || data.rows.length === 0) return "";

    const headers = [
      'Puesto',
      'Porcentaje Asignado (%)',
      'Nombre Empleado',
      'Horas Trabajadas',
      'Propinas Recibidas ($)'
    ];
    
    const rows = [];
    
    rows.push([`"Total Tips Pool: $${(data.total || 0).toFixed(2)}"`].join(','));
    rows.push([''].join(','));

    data.rows.forEach(row => {
      if (row.employeeColumns && row.employeeColumns.length > 0) {
        row.employeeColumns.forEach(employee => {
          rows.push([
            `"${row.position || ''}"`,
            `"${row.percentage || 0}"`,
            `"${employee.name || ''}"`,
            `"${employee.hours || 0}"`,
            `"${employee.tips.toFixed(2)}"`
          ].join(','));
        });
      } else {
        rows.push([
          `"${row.position || ''}"`,
          `"${row.percentage || 0}"`,
          '"Sin empleados asignados"',
          '"0"',
          '"0.00"'
        ].join(','));
      }
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const downloadTipsPoolCSV = (date) => {
    const csvContent = convertTipsPoolToCSV(date);
    if (!csvContent) {
      alert("No hay datos de Tips Pool para descargar en esta fecha.");
      return;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tips_pool_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- TAREA 3: Función para descargar CSV de análisis de empleados ---
  const downloadEmployeeAnalysisCSV = () => {
    if (selectedEmployeesForAnalysis.length === 0) {
      alert("No hay empleados seleccionados para exportar.");
      return;
    }

    const headers = ['Empleado', 'Net Sales', 'Tips', 'Gratuity', '5%', 'T+G', 'T+G-5%'];
    const csvRows = [headers.join(',')];

    selectedEmployeesForAnalysis.forEach(normalizedName => {
      const employeeTotals = calculateEmployeePeriodTotals(normalizedName);
      const displayName = selectedDaysForAnalysis
        .flatMap(date => incomeData[date] || [])
        .find(row => normalizeName(row.name) === normalizedName)?.name || normalizedName;

      const row = [
        `"${displayName}"`,
        employeeTotals.netSales.toFixed(2),
        employeeTotals.tips.toFixed(2),
        employeeTotals.gratuity.toFixed(2),
        employeeTotals.fivePercent.toFixed(2),
        employeeTotals.tPlusG.toFixed(2),
        employeeTotals.tPlusGMinusFive.toFixed(2)
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `analisis_empleados_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generar días del mes
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = lastDay.getDate();
  const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lunes = 0
  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    const monthStr = (currentMonth + 1 < 10 ? '0' : '') + (currentMonth + 1);
    const dayStr = (day < 10 ? '0' : '') + day;
    const dateStr = currentYear + '-' + monthStr + '-' + dayStr;
    days.push({ 
      day, 
      hasCSV: !!uploadedCSVs.find(csv => csv.uploadDate === dateStr), 
      csvs: uploadedCSVs.filter(csv => csv.uploadDate === dateStr) || [],
      hasIncomeData: !!(incomeData[dateStr] && incomeData[dateStr].length > 0),
      hasTipsPoolData: !!(tipsPoolData[dateStr] && tipsPoolData[dateStr].rows && tipsPoolData[dateStr].rows.length > 0)
    });
  }
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* --- TAREA 1: Definición de datalists --- */}
      <datalist id="employee-names">
        {EMPLOYEES_LIST.map(name => <option key={name} value={name} />)}
      </datalist>
      <datalist id="job-positions">
        {POSITIONS_LIST.map(pos => <option key={pos} value={pos} />)}
      </datalist>

      {/* Página de Inicio */}
      {currentView === 'home' && (
        <div
          className="w-full h-screen bg-cover bg-center flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
            backgroundBlendMode: 'overlay'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-70"></div>
          <div className="relative z-10 text-center px-6">
            <h1
              className="text-6xl md:text-8xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500"
              style={{
                fontFamily: 'sans-serif',
                textShadow: '4px 4px 8px rgba(0,0,0,0.7)'
              }}
            >
              El Sabor de mis Raíces
            </h1>
            <p
              className="text-2xl md:text-3xl mb-12 text-yellow-100 font-medium tracking-wide drop-shadow-lg"
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}
            >
              Seleccione la opción deseada
            </p>
            <div className="flex flex-col md:flex-row gap-10 justify-center items-center">
              <div className="relative group">
                <button
                  onClick={() => setCurrentView('salaries')}
                  className="bg-gradient-to-r from-amber-900 to-amber-800 hover:from-amber-800 hover:to-amber-700 px-10 py-6 rounded-2xl text-2xl font-semibold flex items-center gap-4 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl z-10 relative border-2 border-yellow-400 shadow-lg"
                >
                  <span className="text-3xl">👤</span>
                  Verificar Salarios
                </button>
              </div>
              <div className="relative group">
                <button
                  onClick={() => setCurrentView('income-calendar')}
                  className="bg-gradient-to-r from-green-800 to-green-700 hover:from-green-700 hover:to-green-600 px-10 py-6 rounded-2xl text-2xl font-semibold flex items-center gap-4 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl z-10 relative border-2 border-yellow-400 shadow-lg"
                >
                  <span className="text-3xl">📊</span>
                  Ingresos Diarios
                </button>
              </div>
              <div className="relative group">
                <button
                  onClick={() => setCurrentView('tips-pool-calendar')}
                  className="bg-gradient-to-r from-purple-800 to-purple-700 hover:from-purple-700 hover:to-purple-600 px-10 py-6 rounded-2xl text-2xl font-semibold flex items-center gap-4 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl z-10 relative border-2 border-yellow-400 shadow-lg"
                >
                  <span className="text-3xl">💰</span>
                  Tips Pool
                </button>
              </div>
              <div className="relative group">
                <button
                  onClick={() => setCurrentView('analysis-calendar')}
                  className="bg-gradient-to-r from-purple-800 to-purple-700 hover:from-purple-700 hover:to-purple-600 px-10 py-6 rounded-2xl text-2xl font-semibold flex items-center gap-4 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl z-10 relative border-2 border-yellow-400 shadow-lg"
                >
                  <span className="text-3xl">📈</span>
                  Analizar Ingresos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Vista de calendario de Tips Pool */}
      {currentView === 'tips-pool-calendar' && (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentView('home')}
              className="bg-black bg-opacity-30 backdrop-blur-sm hover:bg-opacity-50 px-6 py-3 rounded-xl flex items-center gap-2 text-gray-200 hover:text-yellow-200 transition"
            >
              ← Volver al inicio
            </button>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Tips Pool
            </h2>
            <div className="w-32"></div>
          </div>
          {/* Calendario de Tips Pool */}
          <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <button onClick={goToPrevMonth} className="text-2xl hover:text-yellow-400 transition">⬅️</button>
              <h2 className="text-2xl font-bold text-yellow-400">
                {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={goToNextMonth} className="text-2xl hover:text-yellow-400 transition">➡️</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="font-bold text-yellow-400 py-3">
                  {day}
                </div>
              ))}
              {days.map((d, i) => {
                if (!d) return <div key={i} className="h-16"></div>;
                const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.day.toString().padStart(2, '0')}`;
                return (
                  <div
                    key={i}
                    className={`h-16 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300 p-1 ${
                      d.hasTipsPoolData 
                        ? 'bg-purple-600 hover:bg-purple-500' 
                        : 'hover:bg-gray-700'
                    }`}
                    onClick={() => openTipsPoolDate(dateStr)}
                  >
                    <div className="font-bold">{d.day}</div>
                    {d.hasTipsPoolData && (
                      <div className="text-xs mt-1 text-white">💰</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center text-sm text-gray-400">
              💡 Click en cualquier día para ingresar datos de Tips Pool
            </div>
          </div>
        </div>
      )}
      {/* Vista de Tips Pool por fecha */}
      {currentView === 'tips-pool-day' && selectedDate && (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-between mb-6">
            <button
              onClick={() => setCurrentView('tips-pool-calendar')}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition flex items-center gap-2"
            >
              ← Volver al calendario
            </button>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Tips Pool - {selectedDate}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => downloadTipsPoolCSV(selectedDate)}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
              >
                📥 Descargar CSV
              </button>
              <button
                onClick={saveTipsPoolData}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
              >
                💾 Guardar
              </button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl mb-6">
            <div className="mb-6">
              <label className="block text-lg font-semibold mb-2">Total Tips Pool:</label>
              <input
                type="number"
                step="0.01"
                value={tipsPoolData[selectedDate]?.total || ''}
                onChange={(e) => setTipsPoolData(prev => ({
                  ...prev,
                  [selectedDate]: {
                    ...(prev[selectedDate] || { rows: [] }),
                    total: parseFloat(e.target.value) || 0
                  }
                }))}
                className="bg-gray-700 text-white rounded-lg px-4 py-2 w-48 text-xl"
              />
              
              {(() => {
                const percentageSum = calculatePercentageSum(selectedDate);
                let statusText = '';
                let statusClass = '';
                
                if (percentageSum < 100) {
                  statusText = `Faltan ${100 - percentageSum}% por asignar`;
                  statusClass = 'text-yellow-400';
                } else if (percentageSum === 100) {
                  statusText = '✅ Todo asignado';
                  statusClass = 'text-green-400';
                } else {
                  statusText = `Te pasaste por ${percentageSum - 100}%`;
                  statusClass = 'text-red-500 animate-pulse';
                }
                
                return (
                  <span className={`ml-4 text-lg font-semibold ${statusClass}`}>
                    {statusText}
                  </span>
                );
              })()}
            </div>
            
            <button
              onClick={() => addTipsPoolRow(selectedDate)}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition flex items-center gap-2 mb-4"
            >
              ➕ Agregar Fila
            </button>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '200px' }}>Puesto</th>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '100px' }}>%</th>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '100px' }}>Personal</th>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '150px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(tipsPoolData[selectedDate]?.rows || []).map((row, index) => {
                    const employeeColumns = row.employeeColumns || [];
                    
                    return (
                      <tr key={row.id} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4">
                          {/* --- TAREA 1: Datalist para Puestos en Tips Pool --- */}
                          <input
                            type="text"
                            list="job-positions"
                            value={row.position}
                            onChange={(e) => updateTipsPoolRow(selectedDate, index, 'position', e.target.value)}
                            className="bg-gray-600 text-white rounded px-3 py-2 w-full"
                            placeholder="Puesto"
                            style={{ minWidth: '200px' }}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.1"
                            value={row.percentage}
                            onChange={(e) => updateTipsPoolRow(selectedDate, index, 'percentage', e.target.value)}
                            className="bg-gray-600 text-white rounded px-3 py-2 w-24"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={row.personal}
                            onChange={(e) => updateTipsPoolRow(selectedDate, index, 'personal', e.target.value)}
                            className="bg-gray-600 text-white rounded px-3 py-2 w-20"
                          />
                        </td>
                        
                        {employeeColumns.map((employee, empIndex) => (
                          <td key={empIndex} className="py-3 px-4">
                            <div className="flex flex-col space-y-2">
                              {/* --- TAREA 1: Datalist para Nombres en Tips Pool --- */}
                              <input
                                type="text"
                                list="employee-names"
                                value={employee.name}
                                onChange={(e) => updateTipsPoolRow(selectedDate, index, `employeeName_${empIndex}`, e.target.value)}
                                className="bg-gray-600 text-white rounded px-2 py-1 text-sm"
                                placeholder="Nombre"
                                style={{ minWidth: '150px' }}
                              />
                              <input
                                type="number"
                                step="0.1"
                                value={employee.hours}
                                onChange={(e) => updateTipsPoolRow(selectedDate, index, `employeeHours_${empIndex}`, e.target.value)}
                                className="bg-gray-600 text-white rounded px-2 py-1 text-sm"
                                placeholder="Horas"
                              />
                              <div className="text-xs text-green-400 font-semibold">
                                ${employee.tips.toFixed(2)}
                              </div>
                            </div>
                          </td>
                        ))}
                        
                        <td className="py-3 px-4">
                          <button
                            onClick={() => deleteTipsPoolRow(selectedDate, index)}
                            className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded text-sm"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {(!tipsPoolData[selectedDate] || !tipsPoolData[selectedDate].rows || tipsPoolData[selectedDate].rows.length === 0) && (
            <div className="bg-gray-800 rounded-2xl p-12 text-center shadow-2xl">
              <div className="text-6xl mb-6">💰</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-4">No hay datos para este día</h3>
              <p className="text-gray-400 mb-6">
                Agrega filas para registrar la distribución del Tips Pool.
              </p>
              <button
                onClick={() => addTipsPoolRow(selectedDate)}
                className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-semibold transition hover:scale-105 shadow-lg"
              >
                ➕ Agregar Primera Fila
              </button>
            </div>
          )}
        </div>
      )}
      {/* Vista de calendario de ingresos */}
      {currentView === 'income-calendar' && (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentView('home')}
              className="bg-black bg-opacity-30 backdrop-blur-sm hover:bg-opacity-50 px-6 py-3 rounded-xl flex items-center gap-2 text-gray-200 hover:text-yellow-200 transition"
            >
              ← Volver al inicio
            </button>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              Ingresos Diarios
            </h2>
            <div className="w-32"></div>
          </div>
          {/* Calendario de ingresos */}
          <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <button onClick={goToPrevMonth} className="text-2xl hover:text-yellow-400 transition">⬅️</button>
              <h2 className="text-2xl font-bold text-yellow-400">
                {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={goToNextMonth} className="text-2xl hover:text-yellow-400 transition">➡️</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="font-bold text-yellow-400 py-3">
                  {day}
                </div>
              ))}
              {days.map((d, i) => {
                if (!d) return <div key={i} className="h-16"></div>;
                const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.day.toString().padStart(2, '0')}`;
                return (
                  <div
                    key={i}
                    className={`h-16 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300 p-1 ${
                      d.hasIncomeData 
                        ? 'bg-green-600 hover:bg-green-500' 
                        : 'hover:bg-gray-700'
                    }`}
                    onClick={() => openIncomeDate(dateStr)}
                  >
                    <div className="font-bold">{d.day}</div>
                    {d.hasIncomeData && (
                      <div className="text-xs mt-1 text-white">📊</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center text-sm text-gray-400">
              💡 Click en cualquier día para ingresar datos
            </div>
          </div>
        </div>
      )}
      {/* Vista de análisis de ingresos - Calendario */}
      {currentView === 'analysis-calendar' && (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentView('home')}
              className="bg-black bg-opacity-30 backdrop-blur-sm hover:bg-opacity-50 px-6 py-3 rounded-xl flex items-center gap-2 text-gray-200 hover:text-yellow-200 transition"
            >
              ← Volver al inicio
            </button>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Analizar Ingresos
            </h2>
            <div className="w-32"></div>
          </div>
          {/* Calendario de análisis */}
          <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <button onClick={goToPrevMonth} className="text-2xl hover:text-yellow-400 transition">⬅️</button>
              <h2 className="text-2xl font-bold text-yellow-400">
                {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={goToNextMonth} className="text-2xl hover:text-yellow-400 transition">➡️</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="font-bold text-yellow-400 py-3">
                  {day}
                </div>
              ))}
              {days.map((d, i) => {
                if (!d) return <div key={i} className="h-16"></div>;
                const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.day.toString().padStart(2, '0')}`;
                return (
                  <div
                    key={i}
                    className={`h-16 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300 p-1 ${
                      d.hasIncomeData 
                        ? selectedDaysForAnalysis.includes(dateStr)
                          ? 'bg-blue-600 border-2 border-yellow-400'
                          : 'bg-green-600 hover:bg-green-500'
                        : 'hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      if (d.hasIncomeData) {
                        toggleDaySelection(dateStr);
                      }
                    }}
                  >
                    <div className="font-bold">{d.day}</div>
                    {d.hasIncomeData && (
                      <div className="text-xs mt-1 text-white">📊</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                💡 Click en días con datos para seleccionarlos
              </div>
              {selectedDaysForAnalysis.length > 0 && (
                <button
                  onClick={startCustomAnalysis}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-2 rounded-lg font-semibold transition transform hover:scale-105"
                >
                  Analizar {selectedDaysForAnalysis.length} días seleccionados
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Vista de análisis personalizado */}
      {currentView === 'custom-analysis' && (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-between mb-6">
            <button
              onClick={() => setCurrentView('analysis-calendar')}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition flex items-center gap-2"
            >
              ← Volver al calendario
            </button>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
              Análisis Personalizado
            </h2>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl mb-6">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">Días Seleccionados ({selectedDaysForAnalysis.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedDaysForAnalysis.map((date, index) => (
                <div key={index} className="bg-blue-900 bg-opacity-50 rounded-lg px-3 py-2 text-sm">
                  {date}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {(() => {
              const totals = calculateCustomAnalysisTotals();
              return [
                { title: 'Total Net Sales', value: totals.netSales, color: 'from-green-600 to-green-800', icon: '💰' },
                { title: 'Total Tips', value: totals.tips, color: 'from-yellow-600 to-yellow-800', icon: '✨' },
                { title: 'Total Gratuity', value: totals.gratuity, color: 'from-blue-600 to-blue-800', icon: '🌟' }
              ];
            })().map((metric, index) => (
              <div key={index} className={`bg-gradient-to-br ${metric.color} rounded-2xl p-6 shadow-2xl`}>
                <div className="text-3xl mb-2">{metric.icon}</div>
                <div className="text-3xl font-bold">${metric.value.toFixed(2)}</div>
                <div className="text-gray-200">{metric.title}</div>
              </div>
            ))}
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-cyan-400">Desglose por Día</h3>
              <button
                onClick={() => {
                  const csvData = [];
                  const headers = ['Fecha', 'Net Sales', 'Tips', 'Gratuity', '5%', 'T+G', 'T+G-5%'];
                  csvData.push(headers.join(','));
                  selectedDaysForAnalysis.forEach((date, index) => {
                    const dayTotals = calculateDateTotals(date);
                    const row = [
                      date,
                      dayTotals.netSales.toFixed(2),
                      dayTotals.tips.toFixed(2),
                      dayTotals.gratuity.toFixed(2),
                      dayTotals.fivePercent.toFixed(2),
                      dayTotals.tPlusG.toFixed(2),
                      dayTotals.tPlusGMinusFive.toFixed(2)
                    ];
                    csvData.push(row.join(','));
                  });
                  const totals = calculateCustomAnalysisTotals();
                  const totalRow = [
                    'TOTALES',
                    totals.netSales.toFixed(2),
                    totals.tips.toFixed(2),
                    totals.gratuity.toFixed(2),
                    totals.fivePercent.toFixed(2),
                    totals.tPlusG.toFixed(2),
                    totals.tPlusGMinusFive.toFixed(2)
                  ];
                  csvData.push(totalRow.join(','));
                  const csvContent = csvData.join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', `desglose_por_dia_${new Date().toISOString().split('T')[0]}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
              >
                📥 Descargar CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Fecha</th>
                    <th className="py-3 px-4 font-semibold">Net Sales</th>
                    <th className="py-3 px-4 font-semibold">Tips</th>
                    <th className="py-3 px-4 font-semibold">Gratuity</th>
                    <th className="py-3 px-4 font-semibold">5%</th>
                    <th className="py-3 px-4 font-semibold">T+G</th>
                    <th className="py-3 px-4 font-semibold">T+G-5%</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDaysForAnalysis.map((date, index) => {
                    const dayTotals = calculateDateTotals(date);
                    return (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 font-medium">{date}</td>
                        <td className="py-3 px-4 text-green-400">${dayTotals.netSales.toFixed(2)}</td>
                        <td className="py-3 px-4 text-yellow-400">${dayTotals.tips.toFixed(2)}</td>
                        <td className="py-3 px-4 text-blue-400">${dayTotals.gratuity.toFixed(2)}</td>
                        <td className="py-3 px-4 text-red-400">${dayTotals.fivePercent.toFixed(2)}</td>
                        <td className="py-3 px-4 text-purple-400">${dayTotals.tPlusG.toFixed(2)}</td>
                        <td className="py-3 px-4 text-cyan-400">${dayTotals.tPlusGMinusFive.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-900 font-bold">
                    <td className="py-3 px-4">TOTALES</td>
                    <td className="py-3 px-4 text-green-400">
                      ${calculateCustomAnalysisTotals().netSales.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-yellow-400">
                      ${calculateCustomAnalysisTotals().tips.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-blue-400">
                      ${calculateCustomAnalysisTotals().gratuity.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-red-400">
                      ${calculateCustomAnalysisTotals().fivePercent.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-purple-400">
                      ${calculateCustomAnalysisTotals().tPlusG.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-cyan-400">
                      ${calculateCustomAnalysisTotals().tPlusGMinusFive.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* --- TAREA 2 y 3: Tabla de empleados por periodo modificada --- */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-purple-400 mb-4">Empleados Por Periodo</h3>
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Añadir Empleado al Análisis:</label>
              <select
                defaultValue=""
                onChange={(e) => {
                  const selectedName = e.target.value;
                  if (selectedName && !selectedEmployeesForAnalysis.includes(selectedName)) {
                    setSelectedEmployeesForAnalysis(prev => [...prev, selectedName]);
                  }
                  e.target.value = ""; // Reset dropdown after selection
                }}
                className="w-full md:w-64 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Seleccionar Empleado --</option>
                {[...new Set(
                  selectedDaysForAnalysis
                    .flatMap(date => incomeData[date] || [])
                    .map(row => normalizeName(row.name))
                    .filter(name => name)
                )].sort().map((normalizedEmployeeName, index) => {
                  const originalName = selectedDaysForAnalysis
                    .flatMap(date => incomeData[date] || [])
                    .find(row => normalizeName(row.name) === normalizedEmployeeName)?.name || normalizedEmployeeName;
                  return (
                    <option key={index} value={normalizedEmployeeName}>
                      {originalName}
                    </option>
                  );
                })}
              </select>
            </div>
            
            {selectedEmployeesForAnalysis.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Empleado</th>
                      <th className="py-3 px-4 font-semibold">Net Sales</th>
                      <th className="py-3 px-4 font-semibold">Tips</th>
                      <th className="py-3 px-4 font-semibold">Gratuity</th>
                      <th className="py-3 px-4 font-semibold">5%</th>
                      <th className="py-3 px-4 font-semibold">T+G</th>
                      <th className="py-3 px-4 font-semibold">T+G-5%</th>
                      <th className="py-3 px-4 font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployeesForAnalysis.map((normalizedName, index) => {
                      const employeeTotals = calculateEmployeePeriodTotals(normalizedName);
                      const displayName = selectedDaysForAnalysis
                        .flatMap(date => incomeData[date] || [])
                        .find(row => normalizeName(row.name) === normalizedName)?.name || normalizedName;
                      
                      return (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="py-3 px-4 font-medium">{displayName}</td>
                          <td className="py-3 px-4 text-green-400">${employeeTotals.netSales.toFixed(2)}</td>
                          <td className="py-3 px-4 text-yellow-400">${employeeTotals.tips.toFixed(2)}</td>
                          <td className="py-3 px-4 text-blue-400">${employeeTotals.gratuity.toFixed(2)}</td>
                          <td className="py-3 px-4 text-red-400">${employeeTotals.fivePercent.toFixed(2)}</td>
                          <td className="py-3 px-4 text-purple-400">${employeeTotals.tPlusG.toFixed(2)}</td>
                          <td className="py-3 px-4 text-cyan-400">${employeeTotals.tPlusGMinusFive.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setSelectedEmployeesForAnalysis(prev => prev.filter(name => name !== normalizedName))}
                              className="bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-xs"
                              title="Quitar de la lista"
                            >
                              X
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {selectedEmployeesForAnalysis.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>Seleccione empleados para ver su resumen en el periodo.</p>
              </div>
            )}
            
            {selectedEmployeesForAnalysis.length > 0 && (
              <div className="mt-6 flex gap-4">
                <button
                  onClick={downloadEmployeeAnalysisCSV}
                  className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded-lg font-semibold transition transform hover:scale-105"
                >
                  📥 Descargar CSV
                </button>
                <button
                  onClick={() => setSelectedEmployeesForAnalysis([])}
                  className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg font-semibold transition"
                >
                  Limpiar Selección
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Vista de ingresos por fecha */}
      {currentView === 'income-date' && selectedDate && (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-between mb-6">
            <button
              onClick={() => setCurrentView('income-calendar')}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition flex items-center gap-2"
            >
              ← Volver al calendario
            </button>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              Ingresos - {selectedDate}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => downloadDayDataCSV(selectedDate)}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
              >
                📥 Descargar CSV
              </button>
              <button
                onClick={saveIncomeData}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
              >
                💾 Guardar
              </button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl mb-6">
            <button
              onClick={() => addIncomeRow(selectedDate)}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition flex items-center gap-2 mb-4"
            >
              ➕ Agregar Persona
            </button>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '250px' }}>Nombre Completo</th>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '150px' }}>Puesto</th>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '120px' }}>Net Sales ($)</th>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '120px' }}>Tips ($)</th>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '120px' }}>Gratuity ($)</th>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '100px' }}>5%</th>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '100px' }}>T+G</th>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '120px' }}>T+G-5%</th>
                    <th className="py-3 px-4 font-semibold" style={{ minWidth: '100px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(incomeData[selectedDate] || []).map((row, index) => {
                    return (
                      <tr 
                        key={row.id} 
                        className={`border-b border-gray-700 hover:bg-gray-700 ${row.excludeFivePercent ? 'bg-blue-900 bg-opacity-30' : ''}`}
                      >
                        <td className="py-3 px-4">
                          {/* --- TAREA 1: Datalist para Nombres en Ingresos --- */}
                          <input
                            type="text"
                            list="employee-names"
                            value={row.name}
                            onChange={(e) => updateIncomeRow(selectedDate, index, 'name', e.target.value)}
                            className="bg-gray-600 text-white rounded px-3 py-2 w-full text-lg"
                            placeholder="Nombre completo"
                            style={{ minWidth: '250px' }}
                          />
                        </td>
                        <td className="py-3 px-4">
                          {/* --- TAREA 1: Datalist para Puestos en Ingresos --- */}
                          <input
                            type="text"
                            list="job-positions"
                            value={row.position}
                            onChange={(e) => updateIncomeRow(selectedDate, index, 'position', e.target.value)}
                            className="bg-gray-600 text-white rounded px-3 py-2 w-full text-lg"
                            placeholder="Puesto"
                            style={{ minWidth: '150px' }}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.01"
                            value={row.netSales}
                            onChange={(e) => updateIncomeRow(selectedDate, index, 'netSales', e.target.value)}
                            className="bg-gray-600 text-white rounded px-3 py-2 w-full text-lg"
                            style={{ minWidth: '120px' }}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.01"
                            value={row.tips}
                            onChange={(e) => updateIncomeRow(selectedDate, index, 'tips', e.target.value)}
                            className="bg-gray-600 text-white rounded px-3 py-2 w-full text-lg"
                            style={{ minWidth: '120px' }}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.01"
                            value={row.gratuity}
                            onChange={(e) => updateIncomeRow(selectedDate, index, 'gratuity', e.target.value)}
                            className="bg-gray-600 text-white rounded px-3 py-2 w-full text-lg"
                            style={{ minWidth: '120px' }}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className={`font-bold mr-2 ${row.excludeFivePercent ? 'text-gray-500' : 'text-red-400'}`}>
                              ${row.fivePercent.toFixed(2)}
                            </span>
                            <button
                              onClick={() => toggleFivePercentExclusion(selectedDate, index)}
                              className="bg-gray-700 hover:bg-gray-600 rounded p-1 text-sm"
                              title={row.excludeFivePercent ? "Incluir cálculo del 5%" : "Excluir cálculo del 5%"}
                            >
                              {row.excludeFivePercent ? '🔄' : '🗑️'}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-purple-400">
                          ${row.tPlusG.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-bold text-cyan-400">
                          ${row.tPlusGMinusFive.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => deleteIncomeRow(selectedDate, index)}
                            className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded text-sm"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {incomeData[selectedDate] && incomeData[selectedDate].length > 0 && (
                    <tr className="bg-gray-900 font-bold">
                      <td className="py-3 px-4 text-lg" colSpan="2">TOTALES</td>
                      <td className="py-3 px-4 text-green-400 text-lg">${calculateDateTotals(selectedDate).netSales.toFixed(2)}</td>
                      <td className="py-3 px-4 text-yellow-400 text-lg">${calculateDateTotals(selectedDate).tips.toFixed(2)}</td>
                      <td className="py-3 px-4 text-blue-400 text-lg">${calculateDateTotals(selectedDate).gratuity.toFixed(2)}</td>
                      <td className="py-3 px-4 text-red-400 text-lg">${calculateDateTotals(selectedDate).fivePercent.toFixed(2)}</td>
                      <td className="py-3 px-4 text-purple-400 text-lg">${calculateDateTotals(selectedDate).tPlusG.toFixed(2)}</td>
                      <td className="py-3 px-4 text-cyan-400 text-lg">${calculateDateTotals(selectedDate).tPlusGMinusFive.toFixed(2)}</td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {(!incomeData[selectedDate] || incomeData[selectedDate].length === 0) && (
            <div className="bg-gray-800 rounded-2xl p-12 text-center shadow-2xl">
              <div className="text-6xl mb-6">📊</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-4">No hay datos para este día</h3>
              <p className="text-gray-400 mb-6">
                Agrega personas para registrar los ingresos del día.
              </p>
              <button
                onClick={() => addIncomeRow(selectedDate)}
                className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-semibold transition hover:scale-105 shadow-lg"
              >
                ➕ Agregar Primera Persona
              </button>
            </div>
          )}
        </div>
      )}
      {/* Módulo: Verificar Salarios */}
      {currentView === 'salaries' && !selectedCSV && (
        <div className="p-6 max-w-7xl mx-auto relative">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1556911220-bff31c812dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
              backgroundBlendMode: 'overlay'
            }}
          ></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setCurrentView('home')}
                className="bg-black bg-opacity-30 backdrop-blur-sm hover:bg-opacity-50 px-6 py-3 rounded-xl flex items-center gap-2 text-gray-200 hover:text-yellow-200 transition"
              >
                ← Volver al inicio
              </button>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                Verificar Salarios
              </h2>
              <label className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 px-6 py-3 rounded-xl cursor-pointer font-semibold transition hover:scale-105 shadow-lg border border-yellow-400">
                📤 Subir CSV
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <h3 className="text-3xl font-bold mb-6 text-center text-emerald-400">
              Empleados Asalariados Fijos
            </h3>
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl mb-12">
              <table className="w-full text-left">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="py-4 px-6 font-semibold">Foto</th>
                    <th className="py-4 px-6 font-semibold">Nombre</th>
                    <th className="py-4 px-6 font-semibold">Puesto</th>
                    <th className="py-4 px-6 font-semibold">Salario (6 días)</th>
                    <th className="py-4 px-6 font-semibold">Diario</th>
                    <th className="py-4 px-6 font-semibold">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedSalaryEmployees.map((emp) => (
                    <tr key={emp.name} className="border-b border-gray-700 hover:bg-gray-700 transition">
                      <td className="py-4 px-6">
                        <img src={`https://placehold.co/40x40/1a1a1a/ffffff?text=${emp.name[0]}`} alt={emp.name} className="w-10 h-10 rounded-full" />
                      </td>
                      <td className="py-4 px-6 font-medium">{emp.name}</td>
                      <td className="py-4 px-6">{emp.role}</td>
                      <td className="py-4 px-6 text-yellow-400">${emp.salary.toFixed(2)}</td>
                      <td className="py-4 px-6 text-emerald-400">${emp.daily.toFixed(2)}</td>
                      <td className="py-4 px-6">
                        <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm">Asalariado</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <button onClick={goToPrevMonth} className="text-2xl hover:text-yellow-400 transition">⬅️</button>
                <h2 className="text-2xl font-bold text-yellow-400">
                  {new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={goToNextMonth} className="text-2xl hover:text-yellow-400 transition">➡️</button>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="font-bold text-yellow-400 py-3">
                    {day}
                  </div>
                ))}
                {days.map((d, i) => {
                  if (!d) return <div key={i} className="h-16"></div>;
                  const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.day.toString().padStart(2, '0')}`;
                  return (
                    <div
                      key={i}
                      className={`h-16 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300 p-1 ${
                        d.hasCSV 
                          ? 'bg-amber-600 hover:bg-amber-500' 
                          : 'hover:bg-gray-700'
                      }`}
                      onClick={() => d.hasCSV && openCSV(d.csvs[0])}
                    >
                      <div className="font-bold">{d.day}</div>
                      {d.hasCSV && (
                        <div className="text-xs mt-1 text-white">📄</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Vista del CSV seleccionado */}
      {selectedCSV && currentView === 'salaries' && (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-between mb-6">
            <button
              onClick={() => setSelectedCSV(null)}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition flex items-center gap-2"
            >
              ← Volver al calendario
            </button>
            <div className="flex gap-3">
              <button
                onClick={analyzeData}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg transition flex items-center gap-2"
              >
                📊 Analizar Datos
              </button>
              <button
                onClick={() => downloadReport(selectedCSV)}
                className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg transition flex items-center gap-2"
              >
                📥 Descargar Reporte
              </button>
              <button
                onClick={deleteCSV}
                className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg transition flex items-center gap-2"
              >
                🗑️ Eliminar Reporte
              </button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-yellow-400 mb-2">Reporte de Nómina</h2>
            <p className="text-xl text-gray-300">Archivo: <strong>{selectedCSV.fileName}</strong></p>
            <p className="text-gray-400">Subido el: {selectedCSV.uploadDate}</p>
          </div>
          <div className="space-y-6">
            {Object.values(
              selectedCSV.data.reduce((acc, shift) => {
                const key = shift.fullName;
                if (!acc[key]) {
                  acc[key] = {
                    employee: shift,
                    shifts: [],
                    totalPay: 0,
                    totalHoursHHmm: '0:00'
                  };
                }
                acc[key].shifts.push(shift);
                acc[key].totalPay += shift.pay;
                return acc;
              }, {})
            ).map((group, i) => {
              const isFixed = fixedSalaryEmployees.some(emp => 
                group.employee.fullName.includes(emp.name.split(' ')[0]) || 
                group.employee.fullName.includes(emp.name.split(' ')[1])
              );
              const totalHHmm = sumHHmmTimes(group.shifts.map(shift => shift.hoursFormatted));
              return (
                <div
                  key={i}
                  className="border border-gray-600 rounded-xl overflow-hidden bg-gray-800 shadow-2xl"
                >
                  <div className="bg-gray-900 px-6 py-3 border-b border-gray-600">
                    <h3 className="text-xl font-bold">{group.employee.fullName}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-900">
                        <tr>
                          <th className="py-4 px-6 font-semibold">Puesto</th>
                          <th className="py-4 px-6 font-semibold">Tarifa</th>
                          <th className="py-4 px-6 font-semibold">Hora de Entrada</th>
                          <th className="py-4 px-6 font-semibold">Hora de Salida</th>
                          <th className="py-4 px-6 font-semibold">Horas (Decimal)</th>
                          <th className="py-4 px-6 font-semibold">Horas (HH:mm)</th>
                          <th className="py-4 px-6 font-semibold">Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.shifts.map((shift, j) => (
                          <tr key={j} className="border-b border-gray-700 hover:bg-gray-700 transition">
                            <td className="py-4 px-6">{shift.jobTitle}</td>
                            <td className="py-4 px-6 text-yellow-400">${shift.rate}/h</td>
                            <td className="py-4 px-6 text-sm">{shift.inDate}</td>
                            <td className="py-4 px-6 text-sm">{shift.outDate}</td>
                            <td className="py-4 px-6">{shift.hoursOriginal.toFixed(2)}h</td>
                            <td className="py-4 px-6">{shift.hoursFormatted}</td>
                            <td className="py-4 px-6 font-bold text-green-400">
                              {isFixed ? 'Asalariado' : `$${shift.pay.toFixed(2)}`}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-900 font-bold">
                          <td colSpan="5" className="py-4 px-6 text-right">Total del Empleado:</td>
                          <td className="py-4 px-6 text-yellow-400">{totalHHmm}</td>
                          <td className="py-4 px-6 text-green-400">
                            {isFixed ? 'Asalariado' : `$${group.totalPay.toFixed(2)}`}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Vista de Análisis */}
      {currentView === 'analysis' && analysisData && (
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-between mb-6">
            <button
              onClick={backToSalaries}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition flex items-center gap-2"
            >
              ← Volver al reporte
            </button>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
              Análisis de Datos
            </h2>
            <button
              onClick={() => downloadCSV(selectedCSV.data, `analisis_nomina_${selectedCSV.uploadDate}`)}
              className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg transition flex items-center gap-2"
            >
              📊 Descargar Análisis
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-2xl">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-bold">{analysisData.totals.uniqueEmployees}</div>
              <div className="text-blue-200">Empleados</div>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-6 shadow-2xl">
              <div className="text-3xl mb-2">⏰</div>
              <div className="text-2xl font-bold">{analysisData.totals.totalHours}</div>
              <div className="text-green-200">Horas Totales</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-2xl p-6 shadow-2xl">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold">${analysisData.totals.totalPay}</div>
              <div className="text-yellow-200">Pago Total</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-2xl">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold">${analysisData.totals.averagePayPerEmployee}</div>
              <div className="text-purple-200">Promedio por Empleado</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">Horas Trabajadas por Empleado</h3>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Empleado</th>
                      <th className="py-3 px-4 font-semibold">Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.employeeChartData
                      .sort((a, b) => b.horas - a.horas)
                      .map((emp, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="py-3 px-4">{emp.name}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-700 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${(emp.horas / Math.max(...analysisData.employeeChartData.map(e => e.horas))) * 100}%` }}
                                ></div>
                              </div>
                              <span>{emp.horas}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-green-400 mb-4 text-center">Pago por Empleado</h3>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Empleado</th>
                      <th className="py-3 px-4 font-semibold">Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.employeeChartData
                      .sort((a, b) => b.pago - a.pago)
                      .map((emp, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="py-3 px-4">{emp.name}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-700 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${(emp.pago / Math.max(...analysisData.employeeChartData.map(e => e.pago))) * 100}%` }}
                                ></div>
                              </div>
                              <span>${emp.pago}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-purple-400 mb-4 text-center">Distribución por Puesto</h3>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Puesto</th>
                      <th className="py-3 px-4 font-semibold">Horas</th>
                      <th className="py-3 px-4 font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.positionChartData
                      .sort((a, b) => b.horas - a.horas)
                      .map((pos, index) => {
                        const percentage = ((pos.horas / analysisData.totals.totalHours) * 100).toFixed(1);
                        return (
                          <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                            <td className="py-3 px-4">{pos.name}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-700 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-purple-500 h-2 rounded-full" 
                                    style={{ width: `${(pos.horas / Math.max(...analysisData.positionChartData.map(p => p.horas))) * 100}%` }}
                                  ></div>
                                </div>
                                <span>{pos.horas}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">{percentage}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-orange-400 mb-4 text-center">Empleados por Puesto</h3>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Puesto</th>
                      <th className="py-3 px-4 font-semibold">Empleados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.positionChartData
                      .sort((a, b) => b.empleados - a.empleados)
                      .map((pos, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="py-3 px-4">{pos.name}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-700 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full" 
                                  style={{ width: `${(pos.empleados / Math.max(...analysisData.positionChartData.map(p => p.empleados))) * 100}%` }}
                                ></div>
                              </div>
                              <span>{pos.empleados}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 text-center">Detalle por Empleado</h3>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                  <thead className="bg-gray-700 sticky top-0">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Empleado</th>
                      <th className="py-3 px-4 font-semibold">Horas</th>
                      <th className="py-3 px-4 font-semibold">Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.employeeData
                      .sort((a, b) => b.totalPay - a.totalPay)
                      .map((emp, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="py-3 px-4">{emp.name}</td>
                          <td className="py-3 px-4">{emp.totalHours.toFixed(2)}</td>
                          <td className="py-3 px-4">${emp.totalPay.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-pink-400 mb-4 text-center">Detalle por Puesto</h3>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left">
                  <thead className="bg-gray-700 sticky top-0">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Puesto</th>
                      <th className="py-3 px-4 font-semibold">Empleados</th>
                      <th className="py-3 px-4 font-semibold">Horas</th>
                      <th className="py-3 px-4 font-semibold">Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.positionData
                      .sort((a, b) => b.totalPay - a.totalPay)
                      .map((pos, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="py-3 px-4">{pos.name}</td>
                          <td className="py-3 px-4">{pos.employeeCount}</td>
                          <td className="py-3 px-4">{pos.totalHours.toFixed(2)}</td>
                          <td className="py-3 px-4">${pos.totalPay.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;

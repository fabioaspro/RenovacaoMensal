import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Workbook, Worksheet } from 'exceljs';
import saveAs from 'file-saver';
import * as fs from 'file-saver';
import { of, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor(private http: HttpClient) { }

  public downloadFile(url: string): void {
    const headers = new HttpHeaders().set('Accept', 'application/octet-stream');

    this.http.get(url, { headers, responseType: 'blob' }).subscribe(
      (response: any) => {
        const contentDispositionHeader: string = response.headers.get('Content-Disposition');
        const regex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = regex.exec(contentDispositionHeader);

        const sanitizedFileName = 'valter.txt';
        const file = new Blob([response.body], { type: response.type });

        saveAs(file, sanitizedFileName);
      },
      (error: any) => {
        console.error('Failed to download file', error);
      }
    );
  }

  public exportarParaExcel(
    reportHeading: string,
    reportSubHeading: string,
    headersArray: any[]=[],
    json: any[]=[],
    excelFileName: string,
    sheetName: string,
) {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';

    /* Criar workbook e worksheet */
    const workbook = new Workbook();
    workbook.created = new Date();
    workbook.modified = new Date();
    const worksheet = workbook.addWorksheet(sheetName);

    /* Add Header Row */
    worksheet.addRow([]);
    worksheet.mergeCells('A1:' + this.numToAlpha(headersArray.length - 1) + '1');
    worksheet.getCell('A1').value = reportHeading;
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.getCell('A1').font = { size: 15, bold: true };

    if (reportSubHeading !== '') {
        worksheet.addRow([]);
        worksheet.mergeCells('A2:' + this.numToAlpha(headersArray.length - 1) + '2');
        worksheet.getCell('A2').value = reportSubHeading;
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        worksheet.getCell('A2').font = { size: 12, bold: false };
    }

    worksheet.addRow([]);

    // Informacoes das colunas labels e properties
    let columnsLabels: any[]=[]
    let columnsFields: any[]=[]
    for (const key in headersArray) {
        columnsLabels.push(headersArray[key].label)
        columnsFields.push(headersArray[key].property)
    }

    //Adicionar os labels de cabecalho
    const headerRow = worksheet.addRow(columnsLabels);

    // Cell Style : Fill and Border
    headerRow.eachCell((cell, index) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' },
            bgColor: { argb: 'FF0000FF' }
        };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.font = { size: 12, bold: true };

        worksheet.getColumn(index).width = headersArray[index - 1].length < 20 ? 20 : headersArray[index - 1].length;
    });


    // Adicionar os registros
    json.forEach((element: any) => {
        const eachRow: any[] = [];
        columnsFields.forEach((column) => {
            if (element[column] !== undefined)
                eachRow.push(element[column]);
        });
        //Adicionar a linha
        worksheet.addRow(eachRow);
    });

    worksheet.addRow([]);

    //AutoFill
    this.autoSize(worksheet, 4)


    /*Salvar Arquivo*/
    workbook.xlsx.writeBuffer().then((data: ArrayBuffer) => {
        const blob = new Blob([data], { type: EXCEL_TYPE });
        fs.saveAs(blob, excelFileName + EXCEL_EXTENSION);
    });
    
    
}
private numToAlpha(num: number) {

  let alpha = '';

  for (; num >= 0; num = parseInt((num / 26).toString(), 10) - 1) {
      alpha = String.fromCharCode(num % 26 + 0x41) + alpha;
  }

  return alpha;
}

autoSize(sheet: Worksheet, fromRow: number) {
	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d')
	if (!ctx) {
		return
	}

	const maxColumnLengths: Array<number> = []
	sheet.eachRow((row, rowNum) => {
		if (rowNum < fromRow) {
			return
		}

		row.eachCell((cell, num) => {
			if (typeof cell.value === 'string') {
				if (maxColumnLengths[num] === undefined) {
					maxColumnLengths[num] = 0
				}

				const fontSize = cell.font && cell.font.size ? cell.font.size : 11
				ctx.font = `${fontSize}pt Arial`
				const metrics = ctx.measureText(cell.value)
				const cellWidth = metrics.width

				maxColumnLengths[num] = Math.max(maxColumnLengths[num], cellWidth)
			}
		})
	})

	for (let i = 1; i <= sheet.columnCount; i++) {
		const col = sheet.getColumn(i)
		const width = maxColumnLengths[i]
		if (width) {
			col.width = width / 7.5 + 1
		}
	}
}

}

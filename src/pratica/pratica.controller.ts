import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PraticaService } from './pratica.service';

@Controller()
export class PraticaController {
  constructor(private readonly praticaService: PraticaService) {}

  @Post('/pratica')
  cadastrar(@Body() body: any) {
    return this.praticaService.criar(body);
  }

  @Get('/historico')
  listar(@Query() query: any) {
    return this.praticaService.buscarHistorico(query);
  }

  @Get('/estatisticas')
  obterEstatisticas() {
    return this.praticaService.gerarEstatisticas();
  }
}

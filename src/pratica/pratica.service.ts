import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pratica } from './pratica.schema';
import { CreatePraticaDto } from './dto/create-pratica.dto';

@Injectable()
export class PraticaService {
  constructor(@InjectModel(Pratica.name) private praticaModel: Model<Pratica>) {}

  async criar(data: CreatePraticaDto) {
    const novaPratica = new this.praticaModel(data);
    return novaPratica.save();
  }

  async buscarHistorico(filtros: any) {
    const { nomeUsuario, tipo, dataInicial, dataFinal } = filtros;
    const query: any = {};

    if (nomeUsuario) query.nomeUsuario = nomeUsuario;
    if (tipo) query.tipo = tipo;
    if (dataInicial || dataFinal) {
      query.data = {};
      if (dataInicial) query.data.$gte = new Date(dataInicial);
      if (dataFinal) query.data.$lte = new Date(dataFinal);
    }

    return this.praticaModel.find(query).exec();
  }

  async gerarEstatisticas() {
    const totalGeral = await this.praticaModel.countDocuments();
    const praticas = await this.praticaModel.find().exec();

    const contagemTipos = {};
    const contagemUsuarios = {};
    
    praticas.forEach(p => {
      contagemTipos[p.tipo] = (contagemTipos[p.tipo] || 0) + 1;
      contagemUsuarios[p.nomeUsuario] = (contagemUsuarios[p.nomeUsuario] || 0) + 1;
    });

    const tipoMaisRegistrado = Object.keys(contagemTipos).reduce((a, b) => contagemTipos[a] > contagemTipos[b] ? a : b, '');
    const usuarioMaisAtivo = Object.keys(contagemUsuarios).reduce((a, b) => contagemUsuarios[a] > contagemUsuarios[b] ? a : b, '');

    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
    const totalUltimos30Dias = await this.praticaModel.countDocuments({ data: { $gte: trintaDiasAtras } });

    return {
      tipoMaisRegistrado,
      usuarioMaisAtivo,
      totalPorTipo: contagemTipos,
      totalGeral,
      mediaDiariaUltimos30Dias: (totalUltimos30Dias / 30).toFixed(2)
    };
  }
}

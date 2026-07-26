import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../domain/transaction';
import { ITransactionRepository } from '../domain/transaction.repository';
import { TransactionOrmEntity } from './transaction.orm-entity';
import { TransactionMapper } from './transaction.mapper';

@Injectable()
export class TypeOrmTransactionRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(TransactionOrmEntity)
    private readonly repository: Repository<TransactionOrmEntity>,
  ) {}

  async save(transaction: Transaction): Promise<void> {
    await this.repository.save(TransactionMapper.toOrm(transaction));
  }

  async findById(id: string): Promise<Transaction | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? TransactionMapper.toDomain(entity) : null;
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    const entity = await this.repository.findOne({ where: { reference } });
    return entity ? TransactionMapper.toDomain(entity) : null;
  }

  async existsByReference(reference: string): Promise<boolean> {
    const count = await this.repository.count({ where: { reference } });
    return count > 0;
  }
}

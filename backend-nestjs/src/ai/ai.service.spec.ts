import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

describe('AiService - Context Management', () => {
    let service: AiService;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AiService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string, defaultValue?: any) => {
                            if (key === 'OPENAI_API_KEY') return 'test-key';
                            if (key === 'OPENAI_MODEL') return 'gpt-4-turbo';
                            return defaultValue;
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<AiService>(AiService);
        configService = module.get<ConfigService>(ConfigService);
    });

    describe('buildSmartSample', () => {
        it('should return all rows when total <= 20', () => {
            const results = Array.from({ length: 15 }, (_, i) => ({
                year: i + 1,
                age: 50 + i,
                final_value: 100000 - i * 5000,
            }));

            const profile = { targetAge: 65 };

            // Access private method for testing
            const smartSample = (service as any).buildSmartSample(results, profile);

            expect(smartSample.sample.length).toBe(15);
            expect(smartSample.metadata).toContain('Complete timeline: 15 rows');
        });

        it('should include first 10 and last 10 rows when total > 20', () => {
            const results = Array.from({ length: 45 }, (_, i) => ({
                year: i + 1,
                age: 50 + i,
                final_value: 100000 - i * 5000,
            }));

            const profile = { targetAge: 65 };

            const smartSample = (service as any).buildSmartSample(results, profile);

            expect(smartSample.sample.length).toBeGreaterThanOrEqual(20);
            expect(smartSample.metadata).toContain('Sampled');
            expect(smartSample.metadata).toContain('of 45 rows');
        });

        it('should always include depletion row', () => {
            const results = Array.from({ length: 30 }, (_, i) => ({
                year: i + 1,
                age: 50 + i,
                final_value: i < 19 ? 100000 - i * 5000 : -10000, // Depletion at row 20 (index 19)
            }));

            const profile = {};

            const smartSample = (service as any).buildSmartSample(results, profile);

            // Check that row 20 (index 19) is included
            const depletionRow = smartSample.sample.find((r: any) => r.year === 20);
            expect(depletionRow).toBeDefined();
            expect(depletionRow.final_value).toBeLessThan(0);
            expect(smartSample.metadata).toContain('Depletion at row 20');
        });

        it('should include row before depletion for context', () => {
            const results = Array.from({ length: 30 }, (_, i) => ({
                year: i + 1,
                age: 50 + i,
                final_value: i < 19 ? 100000 - i * 5000 : -10000, // Depletion at row 20 (index 19)
            }));

            const profile = {};

            const smartSample = (service as any).buildSmartSample(results, profile);

            // Check that row 19 (before depletion) is included
            const beforeDepletionRow = smartSample.sample.find((r: any) => r.year === 19);
            expect(beforeDepletionRow).toBeDefined();
            expect(beforeDepletionRow.final_value).toBeGreaterThan(0); // Should still be positive
        });

        it('should include target age row when specified', () => {
            const results = Array.from({ length: 30 }, (_, i) => ({
                year: i + 1,
                age: 50 + i,
                final_value: 100000 - i * 3000,
            }));

            const profile = { targetAge: 65 }; // Row 16 (age 65)

            const smartSample = (service as any).buildSmartSample(results, profile);

            const targetRow = smartSample.sample.find((r: any) => r.age === 65);
            expect(targetRow).toBeDefined();
            expect(smartSample.metadata).toContain('Target age 65 included');
        });

        it('should not include duplicates', () => {
            const results = Array.from({ length: 25 }, (_, i) => ({
                year: i + 1,
                age: 50 + i,
                final_value: i < 10 ? 100000 - i * 10000 : -5000, // Depletion at row 10
            }));

            const profile = { targetAge: 60 }; // Row 11 (age 60)

            const smartSample = (service as any).buildSmartSample(results, profile);

            // Check no duplicates
            const years = smartSample.sample.map((r: any) => r.year);
            const uniqueYears = new Set(years);
            expect(years.length).toBe(uniqueYears.size);
        });
    });

    describe('summarizeHistory', () => {
        it('should return full history when <= 12 turns', async () => {
            const history = Array.from({ length: 20 }, (_, i) => ({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Message ${i + 1}`,
            }));

            const processed = await (service as any).summarizeHistory(history);

            expect(processed.length).toBe(20);
            expect(processed).toEqual(history);
        });

        it('should keep last 10 turns when > 12 turns', async () => {
            const history = Array.from({ length: 30 }, (_, i) => ({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Message ${i + 1}`,
            }));

            // Mock OpenAI response for summarization
            const mockCreate = jest.fn().mockResolvedValue({
                choices: [{ message: { content: 'Summary of conversation' } }],
            });
            (service as any).openai = {
                chat: {
                    completions: {
                        create: mockCreate,
                    },
                },
            };

            const processed = await (service as any).summarizeHistory(history);

            // Should have 1 summary + 20 recent messages = 21 total
            expect(processed.length).toBe(21);
            expect(processed[0].role).toBe('assistant');
            expect(processed[0].content).toContain('Previous conversation summary');
        });

        it('should fallback to truncation on summarization error', async () => {
            const history = Array.from({ length: 30 }, (_, i) => ({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Message ${i + 1}`,
            }));

            // Mock OpenAI to throw error
            const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));
            (service as any).openai = {
                chat: {
                    completions: {
                        create: mockCreate,
                    },
                },
            };

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const processed = await (service as any).summarizeHistory(history);

            // Should just return last 20 messages
            expect(processed.length).toBe(20);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to summarize history:',
                expect.any(Error),
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Integration', () => {
        it('should handle complete flow with smart sampling and history', () => {
            const profile = {
                baseAge: 50,
                retirementAge: 65,
                targetAge: 85,
                currentSavings: 100000,
            };

            const results = Array.from({ length: 35 }, (_, i) => ({
                year: i + 1,
                age: 50 + i,
                period: i < 15 ? 'working' : 'retired',
                value_invested: 100000 + i * 10000,
                total_expenses: 50000,
                total_income_salary: i < 15 ? 80000 : 0,
                total_income_retirement: i >= 15 ? 40000 : 0,
                total_to_be_added: 30000 - i * 1000,
                final_value: i < 25 ? 200000 - i * 8000 : -10000,
            }));

            const smartSample = (service as any).buildSmartSample(results, profile);

            // Verify critical rows are included
            expect(smartSample.sample.length).toBeGreaterThanOrEqual(20);
            expect(smartSample.metadata).toContain('Depletion');
            expect(smartSample.metadata).toContain('Target age 85');

            // Verify depletion row is present
            const hasDepletion = smartSample.sample.some((r: any) => r.final_value < 0);
            expect(hasDepletion).toBe(true);
        });
    });
});

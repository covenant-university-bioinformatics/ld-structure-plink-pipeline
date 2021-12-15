#!/usr/bin/env bash

####    LD structure using plink 1.9
#### 

binary_dir="$HOME/bin";
db_dir="/media/yagoubali/bioinfo3/db/magma" #${binary_dir};
output="LD.out2";

gwas_summary=$1;
outdir=$2;
population=$3;
clump_p1=$4;            ## P-value threshold for a SNP to be included as an index SNP. By default, must have p-value no larger than 0.0001
clump_p2=$5;            ## Secondary significance threshold for clumped SNPs
clump_r2=$6;            ## LD threshold for clumping
clump_kb=$7;            ## Physical distance threshold for clumping 
allow_overlap=$8        ## {Yes, No}
use_gene_region_file=$9 ## {Yes, No}

clump_range=${10}         ##{glist-hg19, glist-hg38}  
clump_range_border=${11}  ## A window arround  gene bounds by the given number of kilobases, default 0

allow_overlap_cmd='';
if [[ "$allow_overlap_cmd" = "Yes" ]]; then
    allow_overlap_cmd='--clump-allow-overlap';
fi

gene_region_cmd=''; 
if [[ "$use_gene_region_file" = "Yes" ]]; then
   gene_region_cmd="--clump-range ${db_dir}/${clump_range}  \
    --clump-range-border ${clump_range_border}";
fi  
 
if [[ "${clump_p1}" > "0.0001" ]]; then
    clump_p1=0.0001;
fi    

#By default, no variant may belong to more than one clump; remove this restriction with --clump-allow-overlap
## GWAS_summary

#./clumping.sh UKB_bv_height_SMR_0.05.txt outdir eur 0.1 0.05 0.8 1 No  Yes glist-hg19 0

${binary_dir}/plink \
    --bfile ${db_dir}/g1000_${population}/g1000_${population} \
    --clump-p1 ${clump_p1} \
    --clump-p2 ${clump_p2} \
    --clump-r2 ${clump_r2} \
    --clump-kb ${clump_kb} \
    --clump ${gwas_summary} \
    --clump-snp-field SNP \
    --clump-field p \
    ${allow_overlap_cmd} \
    ${gene_region_cmd} \
    --out ${outdir}/${output}
